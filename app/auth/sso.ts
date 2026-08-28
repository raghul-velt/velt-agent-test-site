/**
 * The mock identity provider that /sso and /sso-mfa redirect to.
 *
 * Superflow's `sso` mode is the only one where the password is typed into a page on a
 * DIFFERENT origin than the site being read. Everything expensive about that mode exists
 * because of it: the host has to be vetted before anything is typed, the sign-in is two
 * screens rather than one, and cookies have to be captured from both domains.
 *
 * A same-origin mock would exercise none of that. So this file is written to be deployed
 * TWICE from the same repo: once as the site, once as the provider on its own hostname.
 * Set SSO_IDP_ORIGIN on the site deployment to the provider deployment's URL.
 *
 * Note `*.vercel.app` is on the public suffix list, so two Vercel projects really are two
 * different registrable domains. That is what makes this a faithful cross-origin test
 * rather than two names for one site.
 */

/**
 * Where the provider lives. Empty means "same origin", which is a degraded fallback that
 * the provider page calls out loudly rather than letting it pass for a real SSO test.
 */
export const SSO_IDP_ORIGIN = process.env.SSO_IDP_ORIGIN ?? '';

/** True when the provider is genuinely on another origin, i.e. when this test means something. */
export const IS_CROSS_ORIGIN_IDP = SSO_IDP_ORIGIN.trim().length > 0;

/**
 * Shared between the two deployments so the site can verify a code the provider minted.
 *
 * Both deployments are built from this repo, so the default is enough to make the fixture
 * work out of the box; override it in both projects together if you want them isolated.
 */
const SSO_SHARED_SECRET = process.env.SSO_SHARED_SECRET ?? 'velt-agent-test-site-sso';

/** Which of the two flows the provider should run. */
export type SsoMode = 'standard' | 'mfa';

/** Narrows an untrusted query value to a mode, defaulting to the one that can succeed. */
export function toSsoMode(value: string | undefined): SsoMode {
	return value === 'mfa' ? 'mfa' : 'standard';
}

function toHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Mints the authorization code the provider hands back to the site.
 *
 * HMAC rather than a constant so the code cannot be guessed. That matters for a fixture
 * whose entire job is to fail closed: a crawler that never actually signed in must not be
 * able to reach the protected page by inventing a callback URL, because that would look
 * exactly like a passing test.
 */
export async function mintAuthorizationCode(identifier: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(SSO_SHARED_SECRET),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(identifier));
	return toHex(signature).slice(0, 32);
}

/** Constant-time-ish comparison of a returned code against the expected one. */
export async function isValidAuthorizationCode(identifier: string, code: string): Promise<boolean> {
	const expected = await mintAuthorizationCode(identifier);
	if (expected.length !== code.length) {
		return false;
	}
	let differences = 0;
	for (let index = 0; index < expected.length; index += 1) {
		differences |= expected.charCodeAt(index) ^ code.charCodeAt(index);
	}
	return differences === 0;
}

/**
 * Where the provider sends a signed-in visitor back to.
 *
 * Set this on the PROVIDER deployment. It is deliberately not a request parameter: a
 * provider that redirects to whatever callback URL the query string names is an open
 * redirector, and this fixture should not teach that shape. Empty means same origin,
 * which is the degraded single-deployment fallback.
 */
export const SSO_SITE_ORIGIN = process.env.SSO_SITE_ORIGIN ?? '';

/** Builds the provider URL the site redirects an unauthenticated visitor to. */
export function buildAuthorizeUrl({ requestUrl, next, mode }: {
	requestUrl: string;
	next: string;
	mode: SsoMode;
}): URL {
	const base = IS_CROSS_ORIGIN_IDP ? SSO_IDP_ORIGIN : new URL(requestUrl).origin;
	const authorize = new URL('/idp/authorize', base);
	authorize.searchParams.set('mode', mode);
	// Same-site paths only, so a crafted link cannot turn the round trip into an open redirect.
	authorize.searchParams.set('next', next.startsWith('/') ? next : '/sso');
	return authorize;
}

/** The site URL the provider hands control back to, once the sign-in succeeds. */
export function buildCallbackUrl({ requestUrl, next, identifier, code }: {
	requestUrl: string;
	next: string;
	identifier: string;
	code: string;
}): URL {
	const base = SSO_SITE_ORIGIN.trim().length > 0 ? SSO_SITE_ORIGIN : new URL(requestUrl).origin;
	const callback = new URL('/sso/callback', base);
	callback.searchParams.set('ident', identifier);
	callback.searchParams.set('code', code);
	callback.searchParams.set('next', next.startsWith('/') ? next : '/sso');
	return callback;
}
