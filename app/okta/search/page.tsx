import type { Metadata } from 'next';
import styles from '../../auth/auth.module.css';

/**
 * Search results chosen by the `q` query parameter.
 *
 * The fourth shape, and the one where the query string is obviously the page: nobody would
 * argue that `?q=alerts` and `?q=audit` are the same address, yet a crawler that folds query
 * strings away treats them as one, and a pin built from the path alone lands an alerts finding
 * on the audit results.
 *
 * `q` is also the only param on this site that is echoed back to the visitor, so it is the one
 * place user input reaches the page. React escapes the interpolated value, which is what keeps
 * `?q=<script>` a harmless string of text rather than markup.
 *
 * Same rules as the other query-param pages: one marker and one set of planted mistakes per
 * result set, none shared with any other page here. A query with no results and a missing query
 * both answer HTTP 200 with their own marker, because "nothing found" is a page, not an error.
 */

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface Result {
  title: string;
  href: string;
  summary: string;
}

interface ResultSet {
  label: string;
  marker: string;
  results: Result[];
}

const RESULT_SETS: Record<string, ResultSet> = {
  alerts: {
    label: 'alerts',
    marker: 'OKTA-SEARCH-ALERTS-MARKER-9501',
    results: [
      {
        title: 'Set up SharePoint upload alerts',
        href: '/okta/article?id=101',
        summary: 'Builds the rule that sends a notifcation when an uploaded file is acted on.',
      },
      {
        title: 'Alert digests are batched',
        href: '/okta/release-notes?page=1',
        summary: 'Digests are assembled once a minute rather than imediately on every event.',
      },
      {
        title: 'Security topic',
        href: '/okta/topic?category=security&sort=newest',
        summary: 'Every article about who can reach a system and what they can do in it.',
      },
    ],
  },
  keys: {
    label: 'keys',
    marker: 'OKTA-SEARCH-KEYS-MARKER-9502',
    results: [
      {
        title: 'Rotate API keys without downtime',
        href: '/okta/article?id=102',
        summary: 'Issues the new credentails before the old ones are revoked, so nothing drops.',
      },
      {
        title: 'Key rotation reminders',
        href: '/okta/release-notes?page=1',
        summary: 'Warns the owner fourteen days before a key or a signing certifcate expires.',
      },
      {
        title: 'Configure the service',
        href: '/okta/guide?tab=configure',
        summary: 'Where each environment reads its own settings from at start-up.',
      },
    ],
  },
  audit: {
    label: 'audit',
    marker: 'OKTA-SEARCH-AUDIT-MARKER-9503',
    results: [
      {
        title: 'Reading the audit log',
        href: '/okta/article?id=103',
        summary: 'Explains each column and how far back the histroy is kept.',
      },
      {
        title: 'Faster audit search',
        href: '/okta/release-notes?page=2',
        summary: 'Single-actor queries use an index now, which shortens a complience review.',
      },
      {
        title: 'Billing topic',
        href: '/okta/topic?category=billing&sort=oldest',
        summary: 'Plans, seats and renewals, oldest article first.',
      },
    ],
  },
};

/** First value of a query param, since Next hands back an array for repeated keys. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** A blank `?q=` is treated as no query at all, the way a search box with nothing in it is. */
function query(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = query(first((await searchParams).q));
  if (!q) {
    return { title: 'Search the help center, TechNova Help', description: 'Nothing searched for yet.' };
  }
  const set = RESULT_SETS[q];
  return {
    title: set ? `Search: ${q}, TechNova Help` : `No results for ${q}, TechNova Help`,
    description: set ? `${set.results.length} results for ${q}.` : `Nothing matched ${q}.`,
  };
}

export default async function OktaSearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = query(first((await searchParams).q));

  if (!q) {
    return (
      <main className={styles.content}>
        <p className={styles.badge}>SSO · real Okta tenant · query-param page</p>
        <h1>Search the help center</h1>
        <p>
          <strong>OKTA-SEARCH-PROMPT-MARKER-9500.</strong> Nothing has been searched for yet. The
          results live entirely in the query string, so this path on its own is only the
          begining of a search rather than a page of results.
        </p>
        <p>Try one of these:</p>
        <ul>
          {Object.keys(RESULT_SETS).map((key) => (
            <li key={key}><a href={`/okta/search?q=${key}`}>{`?q=${key}`}</a></li>
          ))}
        </ul>
        <p><a href="/okta/articles">Back to the help center</a></p>
      </main>
    );
  }

  const set = RESULT_SETS[q];
  if (!set) {
    return (
      <main className={styles.content}>
        <p className={styles.badge}>SSO · real Okta tenant · query-param page</p>
        <h1>No results</h1>
        <p>
          {/* React escapes this, so a query full of markup stays text. */}
          <strong>OKTA-SEARCH-EMPTY-MARKER-9599.</strong> No results for {q}. This address answers
          with HTTP 200 because an empty result set is a page in its own right, not an error.
        </p>
        <p>A mispelled query finds nothing here. Start from one of the searches that has results.</p>
        <ul>
          {Object.keys(RESULT_SETS).map((key) => (
            <li key={key}><a href={`/okta/search?q=${key}`}>{`?q=${key}`}</a></li>
          ))}
        </ul>
        <p><a href="/okta/articles">Back to the help center</a></p>
      </main>
    );
  }

  return (
    <main className={styles.content}>
      <p className={styles.badge}>SSO · real Okta tenant · query-param page</p>
      <h1>Results for {set.label}</h1>
      <p>
        <strong>{set.marker}.</strong> {set.results.length} results, served for{' '}
        <code>?q={set.label}</code>. Every other query is a different page.
      </p>
      <ul>
        {set.results.map((result) => (
          <li key={result.href}>
            <a href={result.href}>{result.title}</a>. {result.summary}
          </li>
        ))}
      </ul>
      <p>
        {Object.keys(RESULT_SETS).map((key, index) => (
          <span key={key}>
            {index > 0 ? ' · ' : null}
            {key === q ? <strong>{key}</strong> : <a href={`/okta/search?q=${key}`}>{key}</a>}
          </span>
        ))}
      </p>
      <p><a href="/okta/articles">Back to the help center</a></p>
    </main>
  );
}
