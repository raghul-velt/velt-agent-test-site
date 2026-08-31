/**
 * Real Okta, as opposed to the mock provider in /idp.
 *
 * The mock exists so the code paths can be exercised without waiting on a tenant. This is
 * the other half: an area genuinely delegated to Okta, which tests two things the mock
 * cannot.
 *
 *  1. **Okta's own sign-in UI**, not a hand-written imitation of it. If Okta changes its
 *     markup, the identifier-first driver finds out here and nowhere else.
 *  2. **The allowlist bootstrap path.** `okta.com` is a recognised provider, so an admin's
 *     Test access signs in directly and pins the host. The mock lives on `vercel.app`, is
 *     not recognised, and therefore exercises the *other* branch, where a human is asked to
 *     confirm the host first. Both branches matter and only one can be tested at a time.
 *
 * Standard OIDC authorization-code flow, hand-rolled to keep this repo dependency-free.
 * Endpoints come from the discovery document rather than being pasted together, because
 * Okta's org authorization server and its custom ones expose different paths and getting
 * that wrong is the most common setup mistake.
 */

/** Full issuer, e.g. https://dev-12345678.okta.com or .../oauth2/default. */
export const OKTA_ISSUER = (process.env.OKTA_ISSUER ?? '').replace(/\/$/, '');
export const OKTA_CLIENT_ID = process.env.OKTA_CLIENT_ID ?? '';
export const OKTA_CLIENT_SECRET = process.env.OKTA_CLIENT_SECRET ?? '';

/**
 * Overrides the redirect URI when the derived one is wrong.
 *
 * Derived from the incoming request by default, which is right for a single hostname. Set
 * this if the site is reached by more than one name, because Okta matches the redirect URI
 * exactly and a mismatch is rejected at the provider with a message that does not obviously
 * point at this setting.
 */
export const OKTA_REDIRECT_URI = process.env.OKTA_REDIRECT_URI ?? '';

export const OKTA_COOKIE = 'tn_okta';
export const OKTA_STATE_COOKIE = 'tn_okta_state';

/** Whether this deployment has enough configuration to attempt a sign-in at all. */
export function isOktaConfigured(): boolean {
	return OKTA_ISSUER.length > 0 && OKTA_CLIENT_ID.length > 0 && OKTA_CLIENT_SECRET.length > 0;
}

interface OktaEndpoints {
	authorization_endpoint: string;
	token_endpoint: string;
}

/**
 * Reads the provider's endpoints from its discovery document.
 *
 * Cached per process. A cold start pays one extra request, which is irrelevant next to a
 * browser-driven sign-in.
 */
let cachedEndpoints: OktaEndpoints | undefined;

export async function getOktaEndpoints(): Promise<OktaEndpoints> {
	if (cachedEndpoints) {
		return cachedEndpoints;
	}
	const response = await fetch(`${OKTA_ISSUER}/.well-known/openid-configuration`);
	if (!response.ok) {
		// Surfaced to the operator rather than swallowed: a wrong issuer is by far the most
		// likely misconfiguration, and every later error would be a confusing symptom of it.
		throw new Error(
			`Okta discovery failed (${response.status}). Check OKTA_ISSUER: ${OKTA_ISSUER || '(unset)'}`,
		);
	}
	const document = (await response.json()) as Partial<OktaEndpoints>;
	if (!document.authorization_endpoint || !document.token_endpoint) {
		throw new Error('Okta discovery document is missing the endpoints this flow needs.');
	}
	cachedEndpoints = {
		authorization_endpoint: document.authorization_endpoint,
		token_endpoint: document.token_endpoint,
	};
	return cachedEndpoints;
}

/** The exact redirect URI, which has to match what is registered in the Okta app. */
export function resolveRedirectUri(requestUrl: string): string {
	if (OKTA_REDIRECT_URI.trim().length > 0) {
		return OKTA_REDIRECT_URI.trim();
	}
	return new URL('/okta/callback', requestUrl).toString();
}

/** An unguessable value, tying the callback back to the redirect that started it. */
export function createState(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Exchanges the authorization code for tokens.
 *
 * The exchange is authenticated with the client secret over TLS, so the response is already
 * known to come from the provider. This fixture therefore does not separately verify the ID
 * token signature, which a production integration should do. Saying so here rather than
 * leaving it as an unexplained gap.
 */
export async function exchangeCodeForTokens({ code, redirectUri }: {
	code: string;
	redirectUri: string;
}): Promise<{ ok: boolean; detail: string }> {
	const { token_endpoint } = await getOktaEndpoints();
	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: redirectUri,
	});
	const basic = btoa(`${OKTA_CLIENT_ID}:${OKTA_CLIENT_SECRET}`);
	const response = await fetch(token_endpoint, {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			accept: 'application/json',
			authorization: `Basic ${basic}`,
		},
		body,
	});
	if (!response.ok) {
		const detail = await response.text().catch(() => '');
		return { ok: false, detail: detail.slice(0, 300) };
	}
	return { ok: true, detail: '' };
}
