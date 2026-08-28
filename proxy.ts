import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  BASIC_PASSWORD,
  BASIC_USERNAME,
  CF_ACCESS_CLIENT_ID,
  CF_ACCESS_CLIENT_SECRET,
  GATE_COOKIE,
  MEMBER_COOKIE,
  SSO_COOKIE,
  VERCEL_BYPASS_SECRET,
} from './app/auth/credentials';
import { buildAuthorizeUrl } from './app/auth/sso';

/**
 * One protected area per access mode Superflow's Site Access supports.
 *
 * The point of this file is to let an agent run prove which mode it can open:
 *
 *   /basic/*         401 + WWW-Authenticate -> HTTP Basic. Fails loudly when unauthenticated.
 *   /gated/*         200 + password screen  -> the Webflow-shaped gate. Fails SILENTLY: an agent
 *                                              that cannot open it still gets a normal-looking
 *                                              page, which is the whole bug class Site Access
 *                                              exists for.
 *   /members/*       redirect to /login     -> a real login form with username and password.
 *   /bypass-cf/*     302 to an Access page  -> Cloudflare Access service token: TWO headers.
 *   /bypass-vercel/* 401 + challenge page   -> Vercel Protection Bypass: ONE header.
 *   /sso/*           302 to the provider    -> identity provider, identifier-first, can succeed.
 *   /sso-mfa/*       302 to the provider    -> same, but demands a second factor, so an agent can
 *                                              never complete it. That is the point: it proves a
 *                                              run reports "MFA required" and not "wrong password",
 *                                              because those have completely different fixes.
 *
 * The two bypass areas are the only ones with no login and no session. A header is checked on
 * every request, which is also why that mode is the only one that works on the preview proxy,
 * which has no browser.
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

/**
 * The Cloudflare Access service-token pair.
 *
 * Two headers, both required. Sending one of them is the most likely way to configure this
 * wrong, so a half-configured request must fail exactly like an unconfigured one.
 */
function hasValidCloudflareToken(request: NextRequest): boolean {
  return (
    request.headers.get('cf-access-client-id') === CF_ACCESS_CLIENT_ID &&
    request.headers.get('cf-access-client-secret') === CF_ACCESS_CLIENT_SECRET
  );
}

/** Vercel's automation bypass: a single shared secret on a single header. */
function hasValidVercelBypass(request: NextRequest): boolean {
  return request.headers.get('x-vercel-protection-bypass') === VERCEL_BYPASS_SECRET;
}

/**
 * Stamps the response header Superflow's probe uses to name the platform.
 *
 * The probe reads `cf-ray` for Cloudflare and `x-vercel-id` for Vercel, then offers the
 * matching header fields in the portal so an admin never types a header name by hand.
 * Vercel sets `x-vercel-id` on its own; `cf-ray` has to be faked here because this site is
 * not actually behind Cloudflare.
 */
function withCloudflareSignature(response: NextResponse): NextResponse {
  response.headers.set('cf-ray', '8f2e1a9c4d3b0000-TEST');
  return response;
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // The provider hands control back here, so it must never be redirected back out to the
  // provider. Without this the round trip is an infinite loop.
  if (pathname === '/sso/callback') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/bypass-cf')) {
    if (hasValidCloudflareToken(request)) {
      return withCloudflareSignature(NextResponse.next());
    }
    // Access bounces an unauthenticated browser to its own login screen rather than
    // answering with the content, so the agent never sees a 200 it could mistake for the page.
    return withCloudflareSignature(NextResponse.redirect(new URL('/bypass-login', request.url)));
  }

  if (pathname.startsWith('/bypass-vercel')) {
    if (hasValidVercelBypass(request)) {
      return NextResponse.next();
    }
    // Vercel answers a protected deployment with a 401 challenge page, not a redirect.
    return new NextResponse(
      '<!doctype html><title>Authentication Required</title>' +
        '<h1>Authentication Required</h1>' +
        '<p>This deployment is protected. Automation must send the ' +
        '<code>x-vercel-protection-bypass</code> header.</p>',
      { status: 401, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }

  if (pathname.startsWith('/sso-mfa')) {
    // No cookie check: this flow is designed never to issue one.
    return NextResponse.redirect(
      buildAuthorizeUrl({ requestUrl: request.url, next: pathname, mode: 'mfa' }),
    );
  }

  if (pathname.startsWith('/sso')) {
    if (request.cookies.get(SSO_COOKIE)?.value === 'active') {
      return NextResponse.next();
    }
    // Off to another origin entirely. Landing somewhere the admin has not vetted is what
    // the whole `sso` trust model is built to refuse.
    return NextResponse.redirect(
      buildAuthorizeUrl({ requestUrl: request.url, next: pathname, mode: 'standard' }),
    );
  }

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
  matcher: [
    '/basic/:path*',
    '/gated/:path*',
    '/members/:path*',
    '/bypass-cf/:path*',
    '/bypass-vercel/:path*',
    // `/sso/callback` is matched too, and allowed straight through at the top of `proxy`.
    // Leaving it out of the matcher would work as well, but keeping it visible here means
    // the exemption is stated in code rather than hidden in a pattern.
    '/sso/:path*',
    '/sso-mfa/:path*',
  ],
};
