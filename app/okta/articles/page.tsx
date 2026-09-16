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
 *
 * The groups below it cover the param shapes that are not a single id: a paginated list, a
 * pair of params where both matter, a free-text query that is echoed back, and a translation
 * that differs from its English address by one param. Each group also carries the addresses
 * that fall off the end of it, because "no such page" is a page here and always answers 200.
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

      <h2>Translated article</h2>
      <p>
        One param apart from the English article, and genuinely different content, so a run that
        drops the param reviews the wrong language.
      </p>
      <ul>
        <li>
          <a href={'/okta/article?id=101&lang=fr'}>{'?id=101&lang=fr'}</a>, article 101 in French
        </li>
        <li>
          <a href="/okta/article?id=101">{'?id=101'}</a>, the same article in English
        </li>
      </ul>

      <h2>Paginated release notes</h2>
      <p>One path, three pages of notes, chosen by the page param.</p>
      <ul>
        <li><a href="/okta/release-notes?page=1">Page 1</a> <code>?page=1</code></li>
        <li><a href="/okta/release-notes?page=2">Page 2</a> <code>?page=2</code></li>
        <li><a href="/okta/release-notes?page=3">Page 3</a> <code>?page=3</code></li>
        <li><a href="/okta/release-notes?page=9">{'?page=9'}</a>, past the end of the list (answers 200)</li>
        <li><a href="/okta/release-notes?page=two">{'?page=two'}</a>, not a number, so page 1</li>
        <li><a href="/okta/release-notes">no page</a>, which also defaults to page 1</li>
      </ul>

      <h2>Two params that both matter</h2>
      <p>
        The category picks the list, the sort reverses it and changes a visible sentence. Neither
        param can be dropped without changing the page.
      </p>
      <ul>
        <li>
          <a href={'/okta/topic?category=security&sort=newest'}>{'?category=security&sort=newest'}</a>
        </li>
        <li>
          <a href={'/okta/topic?category=security&sort=oldest'}>{'?category=security&sort=oldest'}</a>
        </li>
        <li>
          <a href={'/okta/topic?category=storage&sort=newest'}>{'?category=storage&sort=newest'}</a>
        </li>
        <li>
          <a href={'/okta/topic?category=storage&sort=oldest'}>{'?category=storage&sort=oldest'}</a>
        </li>
        <li>
          <a href={'/okta/topic?category=billing&sort=newest'}>{'?category=billing&sort=newest'}</a>
        </li>
        <li>
          <a href={'/okta/topic?category=billing&sort=oldest'}>{'?category=billing&sort=oldest'}</a>
        </li>
      </ul>

      <h2>Same page, other param order</h2>
      <p>
        These two render exactly the same topic listing, and they are two page keys, because the
        order of the params is part of the key.
      </p>
      <ul>
        <li>
          <a href={'/okta/topic?category=security&sort=oldest'}>{'?category=security&sort=oldest'}</a>
        </li>
        <li>
          <a href={'/okta/topic?sort=oldest&category=security'}>{'?sort=oldest&category=security'}</a>
        </li>
      </ul>

      <h2>Topic edge cases</h2>
      <ul>
        <li>
          <a href={'/okta/topic?category=hardware&sort=newest'}>{'?category=hardware&sort=newest'}</a>,
          an unknown category, which falls back to security and says so
        </li>
        <li>
          <a href="/okta/topic?category=billing">{'?category=billing'}</a>, no sort, which defaults
          to newest
        </li>
        <li><a href="/okta/topic">neither param</a>, which is security and newest</li>
      </ul>

      <h2>Search</h2>
      <p>The query string is the whole page here, and it is the only place visitor input is echoed back.</p>
      <ul>
        <li><a href="/okta/search?q=alerts">{'?q=alerts'}</a></li>
        <li><a href="/okta/search?q=keys">{'?q=keys'}</a></li>
        <li><a href="/okta/search?q=audit">{'?q=audit'}</a></li>
        <li><a href="/okta/search?q=quotas">{'?q=quotas'}</a>, a query with no results (answers 200)</li>
        <li><a href="/okta/search">no query</a>, which is the search prompt</li>
      </ul>

      <p><a href="/okta">Back to the Compliance Vault</a></p>
    </main>
  );
}
