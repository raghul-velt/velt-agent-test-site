import styles from '../auth/auth.module.css';

export const metadata = {
  title: 'Security Runbook — TechNova Solutions',
  description: 'Content behind an SSO account that demands a second factor.',
};

/**
 * Content behind the MFA-enforcing provider, which an agent can never reach.
 *
 * This page should NEVER appear in an agent run. Its marker is the assertion: if a finding
 * ever quotes it, the second-factor screen did not actually block the sign-in, which would
 * mean the "MFA required" outcome is not being produced by a real challenge.
 */
export default function SsoMfaPage() {
  return (
    <main className={styles.content}>
      <p className={styles.badge}>SSO · second factor enforced</p>
      <h1>Security Runbook</h1>
      <p>
        <strong>SSO-MFA-AREA-MARKER-7745.</strong> This sentence should never appear in an agent
        run. If it does, the second-factor screen did not block the sign-in.
      </p>
      <p>
        <a href="/">Back to the public site</a>
      </p>
    </main>
  );
}
