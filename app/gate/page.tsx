import styles from '../auth/auth.module.css';

/**
 * The single-password gate, modelled on Webflow's.
 *
 * Reached by a REWRITE from `/gated/*`, so it answers on the original URL with HTTP 200.
 * That is deliberate and is the entire point of this page: a crawler that cannot open the
 * gate still sees a successful page load, and will happily describe this screen as if it
 * were the site. Superflow's Site Access is what turns that silent wrong answer into either
 * real content or an honest failure.
 */
export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const failed = params.error === '1';

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <p className={styles.brand}>Tech<span>Nova</span></p>
        <h1 className={styles.title}>This site is password protected</h1>
        <p className={styles.hint}>
          Enter the password to view this staging site.
        </p>

        {failed ? <p className={styles.error}>That password is not correct.</p> : null}

        <form method="POST" action="/api/gate">
          <input type="hidden" name="next" value={params.next ?? '/gated'} />
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              autoComplete="off"
              required
            />
          </div>
          <button className={styles.button} type="submit">Enter site</button>
        </form>
      </div>
    </main>
  );
}
