import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import styles from '../../auth/auth.module.css';

/**
 * Paginated release notes, chosen by the `page` query parameter.
 *
 * The third shape a knowledge base serves from one path: a list split across numbered pages,
 * where the only thing that separates page 1 from page 3 is `?page=`. A crawler that folds the
 * query string away sees a single address and reviews whichever page happens to load first,
 * so two thirds of the notes are never read at all.
 *
 * Same rules as the article and guide pages: one marker and one set of planted mistakes per
 * page, none of them shared with any other page on this site, so a finding always names the
 * page it came from.
 *
 * Nothing here 404s. A missing or non-numeric `page` falls back to page 1, and a number
 * outside 1 to 3 answers HTTP 200 with a "No more notes" body, the way a paginated list runs
 * off the end rather than breaking.
 */

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface NotesPage {
  heading: string;
  marker: string;
  body: () => ReactElement;
}

const LAST_PAGE = 3;

const PAGES: Record<string, NotesPage> = {
  '1': {
    heading: 'TechNova Platform 7.4, released 11 September 2026',
    marker: 'OKTA-RELNOTES-P1-MARKER-9301',
    body: () => (
      <>
        <h3>Alert digests are batched</h3>
        <p>
          Digests are now assembled once a minute instead of once a request, which is the
          largest of the perfomance wins in this release. Busy tenants should see the alert
          queue drain in under a minute.
        </p>
        <h3>Key rotation reminders</h3>
        <p>
          Owners are reminded fourteen days before a key expires. The reminder is sent once,
          and the gap betwen the reminder and the expiry is now configurable.
        </p>
        <h3>Audit log export</h3>
        <p>
          CSV export covers the full retention window. Several small improvments to the export
          job mean a year of entries no longer times out.
        </p>
      </>
    ),
  },
  '2': {
    heading: 'TechNova Platform 7.3, released 14 August 2026',
    marker: 'OKTA-RELNOTES-P2-MARKER-9302',
    body: () => (
      <>
        <h3>Connector health panel</h3>
        <p>
          The dashbord shows the last successful sync for every connector, so a stalled
          SharePoint connector is visible without opening the logs.
        </p>
        <h3>Retention settings per environment</h3>
        <p>
          Each environment carries its own retention value. The service reads the paramter at
          start-up, so a restart is still required after a change.
        </p>
        <h3>Faster audit search</h3>
        <p>
          Queries that retreive a single actor now use an index rather than a scan. Wide
          date ranges are unchanged.
        </p>
      </>
    ),
  },
  '3': {
    heading: 'TechNova Platform 7.2, released 2 July 2026',
    marker: 'OKTA-RELNOTES-P3-MARKER-9303',
    body: () => (
      <>
        <h3>Node 20 baseline</h3>
        <p>
          The CLI drops Node 18. Check the compatability notes before upgrading a build agent
          that is pinned to an older runtime.
        </p>
        <h3>Rate limits on the export API</h3>
        <p>
          Export calls are capped at sixty a minute per tenant. The cap keeps a single export
          job from crowding out interactive trafic.
        </p>
        <h3>Service account scopes</h3>
        <p>
          Only a service account that carries the audit scope is elligible to evaluate an alert
          rule. Existing accounts were migrated automatically.
        </p>
      </>
    ),
  },
};

/** First value of a query param, since Next hands back an array for repeated keys. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Whether the param is a whole number, which is the only thing that selects a page. */
function isWholeNumber(value: string | undefined): value is string {
  return value !== undefined && /^-?\d+$/.test(value);
}

/**
 * The page key this address asks for.
 *
 * Anything that is not a whole number, including a missing param, is page 1. A whole number
 * that no page exists for is kept as-is, so the caller can render the end-of-list body and
 * still echo what was asked for.
 */
function requestedPage(value: string | undefined): string {
  return isWholeNumber(value) ? String(Number(value)) : '1';
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const key = requestedPage(first((await searchParams).page));
  const page = PAGES[key];
  return {
    title: page ? `Release notes, page ${key}, TechNova Help` : 'Release notes, end of list, TechNova Help',
    description: page ? page.heading : `There is no release notes page ${key}.`,
  };
}

export default async function OktaReleaseNotesPage({ searchParams }: { searchParams: SearchParams }) {
  const requested = first((await searchParams).page);
  const key = requestedPage(requested);
  const page = PAGES[key];

  if (!page) {
    return (
      <main className={styles.content}>
        <p className={styles.badge}>SSO · real Okta tenant · query-param page</p>
        <h1>Release notes</h1>
        <p>
          <strong>OKTA-RELNOTES-END-MARKER-9399.</strong> No more notes. There is no page {key},
          and there is nothing futher back than page {LAST_PAGE}. This address answers with HTTP
          200 on purpose, the way a paginated list runs off the end rather than breaking.
        </p>
        <p>
          <a href={`/okta/release-notes?page=${LAST_PAGE}`}>Back to page {LAST_PAGE}</a> ·{' '}
          <a href="/okta/release-notes?page=1">Start at page 1</a>
        </p>
        <p><a href="/okta/articles">Back to the help center</a></p>
      </main>
    );
  }

  const number = Number(key);
  const previous = number - 1;
  const next = number + 1;

  return (
    <main className={styles.content}>
      <p className={styles.badge}>SSO · real Okta tenant · query-param page</p>
      <h1>Release notes</h1>
      <p>
        <strong>{page.marker}.</strong> Page {key} of {LAST_PAGE}, served for{' '}
        <code>?page={key}</code>
        {requested === undefined ? ', the default because no page was given' : null}
        {requested !== undefined && !isWholeNumber(requested)
          ? `, the default because "${requested}" is not a number`
          : null}.
      </p>
      <h2>{page.heading}</h2>
      {page.body()}
      <p>
        {previous >= 1 ? (
          <a href={`/okta/release-notes?page=${previous}`}>Previous page</a>
        ) : (
          <span>No previous page</span>
        )}
        {' · '}
        <a href={`/okta/release-notes?page=${next}`}>Next page</a>
      </p>
      <p><a href="/okta/articles">Back to the help center</a></p>
    </main>
  );
}
