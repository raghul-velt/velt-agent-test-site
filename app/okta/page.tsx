import styles from '../auth/auth.module.css';

export const metadata = {
  title: 'Compliance Vault — TechNova Solutions',
  description: 'Content behind a real Okta tenant.',
};

/**
 * Content behind real Okta.
 *
 * Distinct from /sso so both trust-model branches can be tested at once: this one is a
 * recognised provider and bootstraps directly, /sso is not and has to be confirmed by a
 * human first.
 */
export default function OktaPage() {
  return (
    <main className={styles.content}>
      <p className={styles.badge}>SSO · real Okta tenant</p>
      <h1>Compliance Vault</h1>
      <p>
        <strong>OKTA-AREA-MARKER-8856.</strong> If you are reading this sentence, the agent
        signed in through a real Okta tenant and came back with a session.
      </p>

      <h2>Controls</h2>
      <p>
        Evidence is collected quarterly. Owners recieve a reminder two weeks before the
        deadline, and any control that is not signed off effects the next audit window.
      </p>
      <ul>
        <li>Access reviews for all production systems</li>
        <li>Encryption at rest, with a seperate key per environment</li>
        <li>A anual penetration test by an external firm</li>
      </ul>

      <h2>Links</h2>
      <ul>
        <li><a href="https://compliance.technova-solutions.fake/controls">Control register</a></li>
        <li><a href="/">Back to the public site</a></li>
      </ul>
    </main>
  );
}
