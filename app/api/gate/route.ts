import { GATE_COOKIE, GATE_PASSWORD, SESSION_MAX_AGE_SECONDS } from '../../auth/credentials';

/**
 * Accepts the gate password and issues the unlock cookie.
 *
 * Plain form POST plus a 303, no client JavaScript: an agent driving this with a headless
 * browser gets the same behaviour a person does, and the redirect is what carries it back
 * to the page it originally asked for.
 */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const password = String(form.get('password') ?? '');
  const next = String(form.get('next') ?? '/gated');
  // Only same-site paths, so this cannot be used as an open redirect.
  const destination = next.startsWith('/') ? next : '/gated';

  if (password !== GATE_PASSWORD) {
    // Back to the gated URL they came from, with the flag the gate page renders as an error.
    return new Response(null, {
      status: 303,
      headers: { Location: `${destination}?error=1` },
    });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: destination,
      'Set-Cookie': `${GATE_COOKIE}=unlocked; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`,
    },
  });
}
