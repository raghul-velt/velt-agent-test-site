import { SSO_PASSWORD, SSO_USERNAME } from '../../../auth/credentials';
import { buildCallbackUrl, mintAuthorizationCode, toSsoMode } from '../../../auth/sso';

/**
 * Drives the mock provider's screens.
 *
 * Plain form POST plus a 303 at every step, no client JavaScript, matching the rest of this
 * site. The flow is stateless on purpose: everything needed for the next screen travels in
 * the redirect's query string, because proxy and route handlers here may run on separate
 * instances and cannot share memory.
 *
 *   step=identifier -> 303 to the password screen (or back with an error)
 *   step=password   -> standard mode: 303 back to the site with a signed code
 *                      mfa mode:      303 to the second-factor screen, which never completes
 *   step=mfa        -> always back to itself. There is no valid code, by design.
 */
export async function POST(request: Request): Promise<Response> {
	const form = await request.formData();
	const step = String(form.get('step') ?? 'identifier');
	const mode = toSsoMode(String(form.get('mode') ?? ''));
	const rawNext = String(form.get('next') ?? '/sso');
	const next = rawNext.startsWith('/') ? rawNext : '/sso';

	const authorize = new URL('/idp/authorize', request.url);
	authorize.searchParams.set('mode', mode);
	authorize.searchParams.set('next', next);

	const seeOther = (location: string): Response =>
		new Response(null, { status: 303, headers: { Location: location } });

	if (step === 'identifier') {
		const identifier = String(form.get('identifier') ?? '');
		if (identifier !== SSO_USERNAME) {
			// Rejected at the identifier step, the way a provider that does not know the
			// account behaves. The password screen is never reached.
			authorize.searchParams.set('error', '1');
			return seeOther(authorize.toString());
		}
		authorize.searchParams.set('step', 'password');
		authorize.searchParams.set('ident', identifier);
		return seeOther(authorize.toString());
	}

	if (step === 'password') {
		const identifier = String(form.get('ident') ?? '');
		const password = String(form.get('password') ?? '');

		if (identifier !== SSO_USERNAME || password !== SSO_PASSWORD) {
			authorize.searchParams.set('step', 'password');
			authorize.searchParams.set('ident', identifier);
			authorize.searchParams.set('error', '1');
			return seeOther(authorize.toString());
		}

		if (mode === 'mfa') {
			// The password was correct. Stopping HERE, still on the provider's origin, is
			// what makes this a second-factor test rather than a bad-password test.
			authorize.searchParams.set('step', 'mfa');
			authorize.searchParams.set('ident', identifier);
			return seeOther(authorize.toString());
		}

		const code = await mintAuthorizationCode(identifier);
		return seeOther(
			buildCallbackUrl({ requestUrl: request.url, next, identifier, code }).toString(),
		);
	}

	// step === 'mfa'. No code is ever accepted; the visitor stays on the provider.
	authorize.searchParams.set('step', 'mfa');
	authorize.searchParams.set('ident', String(form.get('ident') ?? ''));
	authorize.searchParams.set('error', '1');
	return seeOther(authorize.toString());
}
