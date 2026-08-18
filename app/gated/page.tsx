import styles from '../auth/auth.module.css';

export const metadata = {
  title: 'Roadmap (Staging) — TechNova Solutions',
  description: 'Unreleased roadmap notes behind the staging password.',
};

/**
 * Content behind the single-password gate.
 *
 * Carries a unique marker sentence and a few planted mistakes, in the same spirit as the
 * public pages. That combination is what makes an agent run readable at a glance: findings
 * that quote the marker or the planted errors prove the unlock worked, and findings about
 * "a page asking for a password" prove it did not.
 */
export default function GatedPage() {
  return (
    <main className={styles.content}>
      <p className={styles.badge}>Gated · single password</p>
      <h1>Q3 Roadmap, Internal Draft</h1>
      <p>
        <strong>GATED-AREA-MARKER-7781.</strong> If you are reading this sentence, the staging
        password was accepted and the real page was rendered.
      </p>

      <h2>Shipping this quarter</h2>
      <p>
        We are planning to seperate the billing service from the core API, which will effect
        every customer on the legacy plan. The migration should of started in Q2 but was
        pushed back.
      </p>
      <ul>
        <li>Multi-region failover for the edge cache</li>
        <li>Usage-based billing for the Enterprise teir</li>
        <li>A example integration with the new webhook signer</li>
      </ul>

      <h2>Known risks</h2>
      <p>
        The rollout depends on a vendor contract that is not signed yet. See the
        <a href="https://internal.technova-solutions.fake/roadmap-risks"> risk register</a> for
        the full list, and the <a href="javascript:void(0)">mitigation plan</a> once it is written.
      </p>

      <h2>Links</h2>
      <ul>
        <li><a href="/gated/changelog">Staging changelog</a></li>
        <li><a href="/">Back to the public site</a></li>
      </ul>
    </main>
  );
}
