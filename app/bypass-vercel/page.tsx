import styles from '../auth/auth.module.css';

export const metadata = {
  title: 'Release Candidate — TechNova Solutions',
  description: 'Preview build notes behind Vercel Protection Bypass.',
};

/**
 * Content behind Vercel's single bypass header.
 *
 * The one-header shape matters: an admin who pastes the secret into the Cloudflare pair's
 * fields, or who fills only one of the two, must not reach this page.
 */
export default function BypassVercelPage() {
  return (
    <main className={styles.content}>
      <p className={styles.badge}>Bypass token · Vercel · one header</p>
      <h1>Release Candidate Notes</h1>
      <p>
        <strong>BYPASS-VERCEL-AREA-MARKER-5523.</strong> If you are reading this sentence, the
        <code> x-vercel-protection-bypass</code> header was accepted. There is no session and
        nothing was signed in to.
      </p>

      <h2>In this build</h2>
      <p>
        The checkout rewrite is behind a flag and effects only internal accounts. We will
        seperate the rollout into two phases so support can be trained first.
      </p>
      <ul>
        <li>New pricing page with anual toggle</li>
        <li>Faster cold starts on the edge runtime</li>
        <li>A improved error page for expired preview links</li>
      </ul>

      <h2>Links</h2>
      <ul>
        <li><a href="https://vercel.com/docs/deployment-protection">Deployment protection docs</a></li>
        <li><a href="/">Back to the public site</a></li>
      </ul>
    </main>
  );
}
