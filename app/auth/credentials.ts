/**
 * Credentials for the three protected areas.
 *
 * Deliberately hard-coded and public. This is a throwaway test site whose only job is to be
 * locked in a predictable way, so the same values can be pasted into a Superflow project's
 * Site Access settings. There is nothing real behind these gates.
 *
 * Overridable by env var so a second environment can use different values without a code
 * change, which also makes it easy to test the "wrong password" path.
 */

/** Single shared password. The Webflow-shaped gate at /gated. */
export const GATE_PASSWORD = process.env.GATE_PASSWORD ?? 'velt-gate-2026';

/** HTTP Basic pair, for /basic. */
export const BASIC_USERNAME = process.env.BASIC_USERNAME ?? 'velt';
export const BASIC_PASSWORD = process.env.BASIC_PASSWORD ?? 'velt-basic-2026';

/** Login-form pair, for /members. */
export const MEMBER_USERNAME = process.env.MEMBER_USERNAME ?? 'agent@velt.dev';
export const MEMBER_PASSWORD = process.env.MEMBER_PASSWORD ?? 'velt-form-2026';

export const GATE_COOKIE = 'tn_gate';
export const MEMBER_COOKIE = 'tn_member';

/** One month. Long enough that a crawl never re-authenticates mid-run. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Cloudflare Access service token, for /bypass-cf.
 *
 * A bypass token is not a login: there is no form, no session and no browser involved.
 * The platform in front of the site checks a header pair on every request and either lets
 * it through or does not, which is why this is the only mode that also works on the
 * browser-less preview proxy.
 */
export const CF_ACCESS_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID ?? 'velt-agent-test.access';
export const CF_ACCESS_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET ?? 'velt-cf-bypass-2026';

/** Vercel Protection Bypass for Automation, for /bypass-vercel. One header, not two. */
export const VERCEL_BYPASS_SECRET = process.env.VERCEL_BYPASS_SECRET ?? 'velt-vercel-bypass-2026';

/**
 * The identity-provider account, for /sso and /sso-mfa.
 *
 * Mirrors the shape a real Okta service account has: an email as the identifier, and a
 * password, with no second factor on the standard path. /sso-mfa deliberately demands one.
 */
export const SSO_USERNAME = process.env.SSO_USERNAME ?? 'agent@velt.dev';
export const SSO_PASSWORD = process.env.SSO_PASSWORD ?? 'velt-sso-2026';

export const SSO_COOKIE = 'tn_sso';
