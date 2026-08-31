import styles from '../../auth/auth.module.css';

export const metadata = {
  title: 'Okta not configured — TechNova Solutions',
};

/**
 * Shown when /okta is reached without Okta credentials in the environment.
 *
 * Deliberately explicit rather than a redirect to a broken URL or a blank page. The failure
 * an operator actually hits is "I forgot the env vars", and the page that says so is worth
 * more than a stack trace. It carries no content marker, so an agent that lands here cannot
 * be mistaken for one that got in.
 */
export default function OktaNotConfiguredPage() {
  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <p className={styles.brand}>Tech<span>Nova</span></p>
        <h1 className={styles.title}>Okta is not configured</h1>
        <p className={styles.hint}>
          This area delegates to a real Okta tenant, and this deployment has no tenant set.
          Set <code>OKTA_ISSUER</code>, <code>OKTA_CLIENT_ID</code> and{' '}
          <code>OKTA_CLIENT_SECRET</code>, then redeploy.
        </p>
        <p className={styles.hint}>
          To test single sign on without a tenant, use <a href="/sso">/sso</a> instead, which
          runs against the mock provider in this repo.
        </p>
      </div>
    </main>
  );
}
