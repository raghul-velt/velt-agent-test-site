import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import styles from '../../auth/auth.module.css';

/**
 * A help-center article chosen by the `id` query parameter.
 *
 * One path, many pages. That is how a Salesforce Experience Cloud community serves its
 * knowledge base, and it is the shape Superflow's crawler and pin builder get wrong: the
 * crawler folds every `?id=` into one address, and a finding is pinned to the path alone.
 *
 * Every article has its own marker sentence and its own planted mistakes, and no two
 * articles share a mistake. That is what makes a run readable: a finding about "seperate"
 * that shows up on `?id=101` came from article 102, so the pin landed on the wrong page.
 *
 * The page never returns a 404. A missing id answers with HTTP 200 and a "not found" body,
 * the way a community does for a retired record, so a link checker has to read the page
 * rather than trust the status code.
 */

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface Article {
  title: string;
  marker: string;
  updated: string;
  body: () => ReactElement;
}

const ARTICLES: Record<string, Article> = {
  '101': {
    title: 'Set up SharePoint upload alerts',
    marker: 'OKTA-ARTICLE-101-MARKER-9101',
    updated: '12 September 2026',
    body: () => (
      <>
        <h2>Before you start</h2>
        <p>
          Alerts are only raised for files that are acted on after the upload, so you will not
          recieve one for the upload itself. This article shows a workaround that watches the
          upload folder seperately and raises an alert on the first occurence.
        </p>
        <h2>Steps</h2>
        <ol>
          <li>Open the SharePoint connector and pick the site collection you wants to watch.</li>
          <li>Create a rule for the upload folder. With a short window, less alerts are raised.</li>
          <li>Route the rule to the security channel. The alert are sent as a digest every hour.</li>
        </ol>
        <h2>Related</h2>
        <ul>
          <li><a href="https://docs.technova-solutions.fake/alerts/sharepoint">Alert rule reference</a></li>
          <li><a href="/okta/article?id=102">Rotate API keys without downtime</a></li>
          <li><a href="/okta/article?id=404">Retired article on legacy alerts</a></li>
        </ul>
      </>
    ),
  },
  '102': {
    title: 'Rotate API keys without downtime',
    marker: 'OKTA-ARTICLE-102-MARKER-9102',
    updated: '3 September 2026',
    body: () => (
      <>
        <h2>Why rotate</h2>
        <p>
          Keys should be rotated every ninety days. Each keys is bound to one enviroment, so you
          can definately rotate staging first and accomodate production a week later.
        </p>
        <h2>Steps</h2>
        <ol>
          <li>Create the new key and leave the old one active.</li>
          <li>Deploy the new key to every service. You should of tested this in staging first.</li>
          <li>Revoke the old key once the dashboard shows no traffic on it.</li>
        </ol>
        <h2>Placeholder text left in by the author</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
        <h2>Related</h2>
        <ul>
          <li><a href="https://keys.technova-solutions.fake/rotate">Key rotation policy</a></li>
          <li><a href="/okta/article?id=103">Reading the audit log</a></li>
        </ul>
      </>
    ),
  },
  '103': {
    title: 'Reading the audit log',
    marker: 'OKTA-ARTICLE-103-MARKER-9103',
    updated: '28 August 2026',
    body: () => (
      <>
        <h2>Where the log lives</h2>
        <p>
          Every sign-in and every key change is written to the audit log, wich is kept untill the
          retention window closes. Entries carry the IP adress of the caller, and them logs can be
          exported as CSV.
        </p>
        <h2>Reading an entry</h2>
        <p>
          The actor column shows who made the change. If the actor was went through SSO, the
          identity provider is listed as well.
        </p>
        <h2>Related</h2>
        <ul>
          <li><a href="/okta/article/attachments/audit-export.pdf">Export format (PDF)</a></li>
          <li><a href="/okta/article?id=101">Set up SharePoint upload alerts</a></li>
        </ul>
      </>
    ),
  },
};

/** First value of a query param, since Next hands back an array for repeated keys. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Everything on the address except `id`, rendered the way the address bar shows it. */
function otherParams(params: { [key: string]: string | string[] | undefined }): string {
  const rest = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === 'id' || value === undefined) {
      continue;
    }
    for (const item of Array.isArray(value) ? value : [value]) {
      rest.append(key, item);
    }
  }
  return rest.toString();
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const id = first((await searchParams).id);
  if (!id) {
    return { title: 'Help center article — TechNova Solutions' };
  }
  const article = ARTICLES[id];
  return {
    title: article ? `${article.title} — TechNova Help` : 'Article not found — TechNova Help',
    description: article ? `Help center article ${id}.` : `No article has the id ${id}.`,
  };
}

export default async function OktaArticlePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const id = first(params.id);
  const extras = otherParams(params);

  if (!id) {
    return (
      <main className={styles.content}>
        <p className={styles.badge}>SSO · real Okta tenant · query-param page</p>
        <h1>Help center article</h1>
        <p>
          <strong>OKTA-ARTICLE-NOID-MARKER-9000.</strong> This address has no id, so there is
          nothing to show. Every article on this site is reached through the id query parameter.
          The path alone is not a page.
        </p>
        <p>Articles avaliable right now:</p>
        <ul>
          {Object.entries(ARTICLES).map(([key, article]) => (
            <li key={key}><a href={`/okta/article?id=${key}`}>{article.title}</a></li>
          ))}
        </ul>
        <p><a href="/okta/articles">Back to the help center</a></p>
      </main>
    );
  }

  const article = ARTICLES[id];
  if (!article) {
    return (
      <main className={styles.content}>
        <p className={styles.badge}>SSO · real Okta tenant · query-param page</p>
        <h1>Article not found</h1>
        <p>
          <strong>OKTA-ARTICLE-MISSING-MARKER-9404.</strong> No article has the id {id}. This page
          answers with HTTP 200 on purpose, the way a community does for a retired record, so a
          link checker has to read the page rather than trust the status code.
        </p>
        <p>The article you requsted may have been retired.</p>
        <p><a href="/okta/articles">Back to the help center</a></p>
      </main>
    );
  }

  return (
    <main className={styles.content}>
      <p className={styles.badge}>SSO · real Okta tenant · query-param page</p>
      <h1>{article.title}</h1>
      <p>
        <strong>{article.marker}.</strong> Article {id}, served for <code>?id={id}</code>.
        {extras.length > 0 ? (
          <>
            {' '}Other params on this address: <code>{extras}</code>. They do not change the
            content, but they do change the page key the toolbar computes.
          </>
        ) : null}
      </p>
      <p>Last updated {article.updated}.</p>
      {article.body()}
      <p><a href="/okta/articles">Back to the help center</a></p>
    </main>
  );
}
