import { MEMBER_COOKIE, MEMBER_PASSWORD, MEMBER_USERNAME, SESSION_MAX_AGE_SECONDS } from '../../auth/credentials';

/** Checks the member pair and issues the session cookie. */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');

  if (email !== MEMBER_USERNAME || password !== MEMBER_PASSWORD) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/login?error=1' },
    });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: '/members',
      'Set-Cookie': `${MEMBER_COOKIE}=active; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`,
    },
  });
}
