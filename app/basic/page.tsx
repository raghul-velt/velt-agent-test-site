import styles from '../auth/auth.module.css';

export const metadata = {
  title: 'Ops Runbook — TechNova Solutions',
  description: 'Operations runbook behind HTTP Basic auth.',
};

/**
 * Content behind HTTP Basic auth.
 *
 * This area fails LOUDLY when locked (a 401 the browser cannot render as a page), which is
 * the opposite failure shape to the gate. Both are worth testing: one produces an honest
 * error without any help from Site Access, the other silently produces the wrong content.
 */
export default function BasicPage() {
  return (
    <main className={styles.content}>
      <p className={styles.badge}>Protected · HTTP basic auth</p>
      <h1>Operations Runbook</h1>
      <p>
        <strong>BASIC-AREA-MARKER-4420.</strong> Reaching this sentence means the Basic Auth
        credentials were accepted on every request, not just the first.
      </p>

      <h2>On-call rotation</h2>
      <p>
        Primary on-call recieves the page first. If they do not acknowlege within 5 minutes it
        escalates to the secondary.
      </p>

      <h2>Restarting the ingest workers</h2>
      <p>
        Drain the queue, then restart each worker one-by-one. Do not restart them all at once,
        this will loose any in-flight jobs.
      </p>
      <p><a href="/">Back to the public site</a></p>
    </main>
  );
}
