import styles from '../auth/auth.module.css';

export const metadata = {
  title: 'Customer Portal — TechNova Solutions',
  description: 'Member area behind the login form.',
};

/** Content behind the username and password login form. */
export default function MembersPage() {
  return (
    <main className={styles.content}>
      <p className={styles.badge}>Members · login form</p>
      <h1>Customer Portal</h1>
      <p>
        <strong>MEMBER-AREA-MARKER-9052.</strong> This page is only served with a valid member
        session, so reaching it means the login form was filled and submitted successfully.
      </p>

      <h2>Your SLA this month</h2>
      <p>
        Uptime was 99.7%, which is bellow the 99.9% commitment in your contract. A credit has
        been applied automaticaly to next months invoice.
      </p>

      <h2>Support history</h2>
      <ul>
        <li>#4821 — Webhook retries firing twice (resolved)</li>
        <li>#4795 — Dashboard latency in eu-west (resolved)</li>
        <li>#4770 — Export job stuck (open)</li>
      </ul>
      <p><a href="/">Back to the public site</a></p>
    </main>
  );
}
