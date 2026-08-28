import styles from '../auth/auth.module.css';

export const metadata = {
  title: 'Partner Portal (Access) — TechNova Solutions',
  description: 'Partner material behind a Cloudflare Access service token.',
};

/**
 * Content behind the Cloudflare Access header pair.
 *
 * Reaching this page proves both headers were sent AND that they were sent to this domain.
 * Carries a unique marker so an agent run is readable at a glance: a finding quoting the
 * marker proves the token worked, a finding about a sign-in screen proves it did not.
 */
export default function BypassCloudflarePage() {
  return (
    <main className={styles.content}>
      <p className={styles.badge}>Bypass token · Cloudflare Access · two headers</p>
      <h1>Partner Enablement Pack</h1>
      <p>
        <strong>BYPASS-CF-AREA-MARKER-4412.</strong> If you are reading this sentence, both
        <code> CF-Access-Client-Id</code> and <code>CF-Access-Client-Secret</code> were accepted
        and no sign-in happened at all.
      </p>

      <h2>Reseller tiers</h2>
      <p>
        Partners on the legacy agreement recieve a 12% margin, which is diffrent from the
        published rate. The new tier structure should of been announced last quarter.
      </p>
      <ul>
        <li>Registered: deal registration and lead routing</li>
        <li>Certified: co-marketing funds and a dedicated managment contact</li>
        <li>Strategic: joint roadmap access and priorty support</li>
      </ul>

      <h2>Links</h2>
      <ul>
        <li><a href="https://partners.technova-solutions.fake/agreement">Partner agreement</a></li>
        <li><a href="/">Back to the public site</a></li>
      </ul>
    </main>
  );
}
