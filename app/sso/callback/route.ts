import { SESSION_MAX_AGE_SECONDS, SSO_COOKIE } from '../../auth/credentials';
import { isValidAuthorizationCode } from '../../auth/sso';

/**
 * Where the provider hands control back to the site.
 *
 * Verifies the code before issuing the session cookie. That check is what stops the fixture
 * from producing a false pass: without it, anything that simply requested
 * `/sso/callback?ident=...` would be let in, and an agent that never signed in at all would
 * look exactly like one that did.
 *
 * Exempted from the proxy at the top of `proxy.ts`, otherwise it would be redirected back
 * out to the provider forever.
 */
export async function GET(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const identifier = url.searchParams.get('ident') ?? '';
	const code = url.searchParams.get('code') ?? '';
	const rawNext = url.searchParams.get('next') ?? '/sso';
	const next = rawNext.startsWith('/') ? rawNext : '/sso';

	if (!identifier || !code || !(await isValidAuthorizationCode(identifier, code))) {
		// Straight back to the front door. A failed callback must not look like a session.
		return new Response(null, { status: 303, headers: { Location: '/sso' } });
	}

	return new Response(null, {
		status: 303,
		headers: {
			Location: next,
			'Set-Cookie': `${SSO_COOKIE}=active; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`,
		},
	});
}
