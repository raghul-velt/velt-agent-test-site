import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { BASIC_PASSWORD, BASIC_USERNAME, GATE_COOKIE, MEMBER_COOKIE } from './app/auth/credentials';

/**
 * Three protected areas, one per access mode Superflow's Site Access supports.
 *
 * The point of this file is to let an agent run prove which mode it can open:
 *
 *   /basic/*   401 + WWW-Authenticate  -> HTTP Basic. Fails loudly when unauthenticated.
 *   /gated/*   200 + password screen   -> the Webflow-shaped gate. Fails SILENTLY: an agent
 *                                         that cannot open it still gets a normal-looking page,
 *                                         which is the whole bug class Site Access exists for.
 *   /members/* redirect to /login      -> a real login form with username and password.
 *
 * Note for Next 16: this file is `proxy.ts`, not `middleware.ts`. Middleware was renamed in
 * this release and a `middleware.ts` here would simply never run.
 */

/** Returns the 401 that makes a browser (and Puppeteer's page.authenticate) offer credentials. */
function basicAuthChallenge(): NextResponse {
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="TechNova Staging", charset="UTF-8"',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}

/** Reads `Authorization: Basic ...` and checks it against the expected pair. */
function hasValidBasicAuth(request: NextRequest): boolean {
  const header = request.headers.get('authorization');
  if (!header?.toLowerCase().startsWith('basic ')) {
    return false;
  }
  try {
    const decoded = atob(header.slice(6).trim());
    const separator = decoded.indexOf(':');
    if (separator === -1) {
      return false;
    }
    return decoded.slice(0, separator) === BASIC_USERNAME && decoded.slice(separator + 1) === BASIC_PASSWORD;
  } catch {
    // A malformed header is simply not valid credentials.
    return false;
  }
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/basic')) {
    return hasValidBasicAuth(request) ? NextResponse.next() : basicAuthChallenge();
  }

  if (pathname.startsWith('/gated')) {
    if (request.cookies.get(GATE_COOKIE)?.value === 'unlocked') {
      return NextResponse.next();
    }
    // Rewrite, NOT redirect: the gate has to answer on the original URL with a 200, the way
    // Webflow, Shopify and Squarespace do. That is what makes this a useful test — a naive
    // crawler sees a successful page load and happily reads the password screen.
    const gateUrl = new URL('/gate', request.url);
    // A rewrite does not carry the original query string, so both of these have to be set
    // explicitly: `error` is what renders the wrong-password message, and `next` is what
    // sends the visitor back to the page they actually asked for rather than the root.
    if (request.nextUrl.searchParams.get('error') === '1') {
      gateUrl.searchParams.set('error', '1');
    }
    gateUrl.searchParams.set('next', pathname);
    return NextResponse.rewrite(gateUrl);
  }

  if (pathname.startsWith('/members')) {
    if (request.cookies.get(MEMBER_COOKIE)?.value === 'active') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/basic/:path*', '/gated/:path*', '/members/:path*'],
};
