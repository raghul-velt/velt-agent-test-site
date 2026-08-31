import {
  OKTA_CLIENT_ID,
  OKTA_STATE_COOKIE,
  createState,
  getOktaEndpoints,
  isOktaConfigured,
  resolveRedirectUri,
} from '../../auth/okta';

/**
 * Starts the Okta sign-in.
 *
 * Kept out of the proxy on purpose. Discovery needs a network call and the proxy is meant
 * to stay a cheap edge check, so the proxy just bounces here and this route builds the real
 * authorize URL.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isOktaConfigured()) {
    return new Response(null, { status: 303, headers: { Location: '/okta/not-configured' } });
  }

  const url = new URL(request.url);
  const rawNext = url.searchParams.get('next') ?? '/okta';
  const next = rawNext.startsWith('/') ? rawNext : '/okta';

  try {
    const { authorization_endpoint } = await getOktaEndpoints();
    const state = createState();
    const authorize = new URL(authorization_endpoint);
    authorize.searchParams.set('client_id', OKTA_CLIENT_ID);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('scope', 'openid profile email');
    authorize.searchParams.set('redirect_uri', resolveRedirectUri(request.url));
    authorize.searchParams.set('state', state);

    // The state travels in a cookie as well as the URL, and the callback requires them to
    // match. SameSite=Lax survives the top-level redirect back from Okta, which is exactly
    // the case Lax exists for.
    const cookie = [
      `${OKTA_STATE_COOKIE}=${state}.${encodeURIComponent(next)}`,
      'Path=/',
      'Max-Age=600',
      'HttpOnly',
      'SameSite=Lax',
    ].join('; ');

    return new Response(null, {
      status: 303,
      headers: { Location: authorize.toString(), 'Set-Cookie': cookie },
    });
  } catch (error) {
    // A failed discovery is a configuration problem, and saying so beats a redirect loop.
    const detail = error instanceof Error ? error.message : 'unknown error';
    return new Response(
      `<!doctype html><title>Okta not reachable</title><h1>Okta is configured but not reachable</h1><p>${detail}</p>`,
      { status: 500, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }
}
