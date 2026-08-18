import styles from '../auth/auth.module.css';

/**
 * Username + password login form, for the `form` access mode.
 *
 * Unlike the gate, this lives on its own URL and `/members/*` redirects here, which is how
 * most hand-rolled logins behave. It uses ordinary input names (`email`, `password`) and a
 * real submit button so the generic form-fill heuristics have something conventional to
 * find, with no client JavaScript involved.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const failed = params.error === '1';

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <p className={styles.brand}>Tech<span>Nova</span></p>
        <h1 className={styles.title}>Sign in to the customer portal</h1>
        <p className={styles.hint}>
          Members can view release notes, SLA reports, and support history.
        </p>

        {failed ? <p className={styles.error}>Those details did not match an account.</p> : null}

        <form method="POST" action="/api/login">
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className={styles.button} type="submit">Sign in</button>
        </form>
      </div>
    </main>
  );
}
