import styles from '../../auth/auth.module.css';

export const metadata = {
  title: 'Staging Changelog — TechNova Solutions',
  description: 'Build notes for the staging environment.',
};

/** A second gated page, so a crawl has more than one protected URL to walk. */
export default function GatedChangelogPage() {
  return (
    <main className={styles.content}>
      <p className={styles.badge}>Gated · single password</p>
      <h1>Staging Changelog</h1>
      <p>
        <strong>GATED-AREA-MARKER-7781.</strong> Second protected page, reachable only after
        the gate is open. A crawl that unlocked the site should find this from the roadmap page.
      </p>
      <h2>Build 482</h2>
      <p>Fixed a bug were the deploy log truncated after 200 lines.</p>
      <h2>Build 481</h2>
      <p>Improved cold start times by aproximately 40%.</p>
      <p><a href="/gated">Back to the roadmap</a></p>
    </main>
  );
}
