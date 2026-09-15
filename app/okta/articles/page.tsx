import styles from '../../auth/auth.module.css';

export const metadata = {
  title: 'Help Center — TechNova Solutions',
  description: 'Query-param pages behind a real Okta tenant.',
};

/**
 * The index of the query-param pages.
 *
 * Every link below is the same path with a different query string. That is the shape of a
 * Salesforce community's knowledge base, and the index exists so a crawl that keeps query
 * strings has something to discover, and a human has one place to copy addresses from.
 *
 * The "same article, different address" group is the interesting one. Those addresses
 * render identical content, but each is a different page key to the toolbar once the
 * project setting "Consider URL query params as separate pages" is on.
 */
export default function OktaHelpCenterPage() {
  return (
    <main className={styles.content}>
      <p className={styles.badge}>SSO · real Okta tenant · query-param pages</p>
      <h1>Help Center</h1>
      <p>
        <strong>OKTA-HELP-INDEX-MARKER-8900.</strong> Every artical below is the same path with a
        different query string, the way a Salesforce community serves its knowlege base. Open one
        and the address bar is the only thing that says which page you are on.
      </p>

      <h2>Articles</h2>
      <ul>
        <li><a href="/okta/article?id=101">Set up SharePoint upload alerts</a> <code>?id=101</code></li>
        <li><a href="/okta/article?id=102">Rotate API keys without downtime</a> <code>?id=102</code></li>
        <li><a href="/okta/article?id=103">Reading the audit log</a> <code>?id=103</code></li>
      </ul>

      <h2>Same article, different address</h2>
      <p>
        These render the same article as above, but each one is a different page key to the
        toolbar when query params count as separate pages.
      </p>
      <ul>
        <li>
          <a href={'/okta/article?id=102&lang=en'}>{'?id=102&lang=en'}</a>, an extra param
        </li>
        <li>
          <a href={'/okta/article?lang=en&id=102'}>{'?lang=en&id=102'}</a>, the same params in the
          other order
        </li>
        <li>
          <a href={'/okta/article?id=101&utm_source=newsletter'}>{'?id=101&utm_source=newsletter'}</a>,
          a tracking param
        </li>
      </ul>

      <h2>Edge cases</h2>
      <ul>
        <li><a href="/okta/article?id=999">{'?id=999'}</a>, an id that does not exist (answers 200)</li>
        <li><a href="/okta/article">no id at all</a></li>
      </ul>

      <h2>Tabbed guide</h2>
      <p>One path, three tabs, chosen by the tab param.</p>
      <ul>
        <li><a href="/okta/guide?tab=install">Install</a> <code>?tab=install</code></li>
        <li><a href="/okta/guide?tab=configure">Configure</a> <code>?tab=configure</code></li>
        <li><a href="/okta/guide?tab=faq">FAQ</a> <code>?tab=faq</code></li>
        <li><a href="/okta/guide">no tab</a>, which defaults to Install</li>
      </ul>

      <p><a href="/okta">Back to the Compliance Vault</a></p>
    </main>
  );
}
