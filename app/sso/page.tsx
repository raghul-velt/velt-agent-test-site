import styles from '../auth/auth.module.css';

export const metadata = {
  title: 'Employee Handbook — TechNova Solutions',
  description: 'Internal handbook behind single sign on.',
};

/**
 * Content behind the identity provider.
 *
 * Reaching this page proves the whole round trip worked: the redirect to another origin, the
 * host being vetted before anything was typed, the two-screen identifier-first sign-in, and
 * the trip back with a session.
 */
export default function SsoPage() {
  return (
    <main className={styles.content}>
      <p className={styles.badge}>SSO · identity provider on another origin</p>
      <h1>Employee Handbook</h1>
      <p>
        <strong>SSO-AREA-MARKER-6634.</strong> If you are reading this sentence, the agent was
        redirected to the identity provider, signed in across two screens, and came back with a
        session.
      </p>

      <h2>Working here</h2>
      <p>
        Every new joiner recieves a laptop in there first week. Expenses over $200 need
        approval from you're manager, and reciepts should be filed within 30 days.
      </p>
      <ul>
        <li>Core hours are 10:00 to 16:00 local</li>
        <li>Quarterly reviews, with a lightweight monthly check in</li>
        <li>Learning budget is seperate from the team budget</li>
      </ul>

      <h2>Links</h2>
      <ul>
        <li><a href="https://intranet.technova-solutions.fake/handbook">Full handbook</a></li>
        <li><a href="/">Back to the public site</a></li>
      </ul>
    </main>
  );
}
