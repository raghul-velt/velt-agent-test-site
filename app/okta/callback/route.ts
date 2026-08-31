import { SESSION_MAX_AGE_SECONDS } from '../../auth/credentials';
import { OKTA_COOKIE, OKTA_STATE_COOKIE, exchangeCodeForTokens, resolveRedirectUri } from '../../auth/okta';

/** Reads one cookie out of the request header, since route handlers get the raw string. */
function readCookie(request: Request, name: string): string {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return rest.join('=');
    }
  }
  return '';
}

/**
 * Where Okta hands control back.
 *
 * Verifies the state before spending a token exchange, then issues the session. Exempted
 * from the proxy, otherwise it would be bounced back into the sign-in it just completed.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') ?? '';
  const returnedState = url.searchParams.get('state') ?? '';
  const oktaError = url.searchParams.get('error');

  const failure = (reason: string): Response =>
    new Response(
      `<!doctype html><title>Sign-in failed</title><h1>Okta sign-in did not complete</h1><p>${reason}</p>`,
      { status: 401, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );

  if (oktaError) {
    return failure(`Okta returned: ${oktaError}. ${url.searchParams.get('error_description') ?? ''}`);
  }

  const stored = readCookie(request, OKTA_STATE_COOKIE);
  const separator = stored.indexOf('.');
  const expectedState = separator === -1 ? stored : stored.slice(0, separator);
  const rawNext = separator === -1 ? '/okta' : decodeURIComponent(stored.slice(separator + 1));
  const next = rawNext.startsWith('/') ? rawNext : '/okta';

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    // Without this, a bare request to the callback would look exactly like a completed
    // sign-in, and an agent that never authenticated would appear to pass.
    return failure('The sign-in state did not match. Start again from /okta.');
  }

  const exchange = await exchangeCodeForTokens({ code, redirectUri: resolveRedirectUri(request.url) });
  if (!exchange.ok) {
    return failure(`The token exchange was rejected. ${exchange.detail}`);
  }

  return new Response(null, {
    status: 303,
    headers: [
      ['Location', next],
      ['Set-Cookie', `${OKTA_COOKIE}=active; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`],
      ['Set-Cookie', `${OKTA_STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`],
    ],
  });
}
