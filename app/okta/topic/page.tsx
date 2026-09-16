import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import styles from '../../auth/auth.module.css';

/**
 * A topic listing chosen by TWO query parameters, `category` and `sort`.
 *
 * The article and guide pages each turn on a single param. This one exists because the
 * interesting failures start at two: a crawler that keeps `category` but drops `sort` reports
 * one page where there are two, and a pin key built from `category` alone lands findings from
 * the oldest-first page on the newest-first one.
 *
 * Both params are load bearing. `category` picks the list and the marker, and `sort` reverses
 * the order AND changes a visible sentence, so `?category=security&sort=newest` and
 * `?category=security&sort=oldest` are genuinely different pages rather than the same page
 * reached twice.
 *
 * One marker and one set of planted mistakes per category, none shared with any other page on
 * this site. An unknown category falls back to security and says so, a missing or unknown sort
 * falls back to newest and says so, and every address answers HTTP 200.
 */

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface TopicArticle {
  title: string;
  updated: string;
  href: string;
  note: string;
}

interface Topic {
  label: string;
  marker: string;
  intro: () => ReactElement;
  /** Newest first. The oldest-first page is this list reversed. */
  articles: TopicArticle[];
}

const TOPICS: Record<string, Topic> = {
  security: {
    label: 'Security',
    marker: 'OKTA-TOPIC-SECURITY-MARKER-9401',
    intro: () => (
      <p>
        Everything in this topic is about who can reach a system and what they can do once they
        are in. Start with the authetication articles, then read the key rotation one before you
        grant any long lived credential.
      </p>
    ),
    articles: [
      {
        title: 'Set up SharePoint upload alerts',
        updated: '12 September 2026',
        href: '/okta/article?id=101',
        note: 'Raises an alert on the first action taken against an uploaded file.',
      },
      {
        title: 'Rotate API keys without downtime',
        updated: '3 September 2026',
        href: '/okta/article?id=102',
        note: 'A key that outlives its owner is the most common vulnerabilty we see.',
      },
      {
        title: 'Reading the audit log',
        updated: '28 August 2026',
        href: '/okta/article?id=103',
        note: 'Shows which actor held which priviledge at the time of a change.',
      },
    ],
  },
  storage: {
    label: 'Storage',
    marker: 'OKTA-TOPIC-STORAGE-MARKER-9402',
    intro: () => (
      <p>
        Storage covers retention, archives and the limits that apply to each plan. Watch the
        bandwith on the export job if you run it during business hours.
      </p>
    ),
    articles: [
      {
        title: 'Retention windows per environment',
        updated: '9 September 2026',
        href: '/okta/guide?tab=configure',
        note: 'Set a threshhold per environment rather than one value for the whole tenant.',
      },
      {
        title: 'Export the audit log as CSV',
        updated: '28 August 2026',
        href: '/okta/article?id=103',
        note: 'Large exports are streamed, so the file arrives before the job finishes.',
      },
      {
        title: 'Archive format and compression',
        updated: '19 August 2026',
        href: '/okta/release-notes?page=2',
        note: 'Archives use the same compresion settings as the nightly backup.',
      },
    ],
  },
  billing: {
    label: 'Billing',
    marker: 'OKTA-TOPIC-BILLING-MARKER-9403',
    intro: () => (
      <p>
        Billing articles cover plans, seats and what happens at renewal. Every invoce is issued
        on the first working day of the month.
      </p>
    ),
    articles: [
      {
        title: 'Change your plan mid-cycle',
        updated: '7 September 2026',
        href: '/okta/release-notes?page=1',
        note: 'A mid-cycle change is prorated against the remaining days of the subcription.',
      },
      {
        title: 'Seats and service accounts',
        updated: '30 August 2026',
        href: '/okta/guide?tab=faq',
        note: 'Service accounts do not consume a seat.',
      },
      {
        title: 'Invoices in another currency',
        updated: '11 August 2026',
        href: '/okta/guide?tab=install',
        note: 'The curency is fixed for the life of the contract and cannot be switched later.',
      },
    ],
  },
};

const DEFAULT_CATEGORY = 'security';
const DEFAULT_SORT = 'newest';
const SORTS: Record<string, string> = { newest: 'Newest first.', oldest: 'Oldest first.' };

/** First value of a query param, since Next hands back an array for repeated keys. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const category = first(params.category) ?? '';
  const sort = first(params.sort) ?? '';
  const topic = TOPICS[category] ?? TOPICS[DEFAULT_CATEGORY];
  const sortKey = sort in SORTS ? sort : DEFAULT_SORT;
  return {
    title: `${topic.label} articles, ${sortKey} first, TechNova Help`,
    description: `${topic.label} topic listing, sorted ${sortKey} first.`,
  };
}

export default async function OktaTopicPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedCategory = first(params.category);
  const requestedSort = first(params.sort);

  const knownCategory = requestedCategory !== undefined && requestedCategory in TOPICS;
  const categoryKey = knownCategory ? (requestedCategory as string) : DEFAULT_CATEGORY;
  const topic = TOPICS[categoryKey];

  const knownSort = requestedSort !== undefined && requestedSort in SORTS;
  const sortKey = knownSort ? (requestedSort as string) : DEFAULT_SORT;
  const articles = sortKey === 'oldest' ? [...topic.articles].reverse() : topic.articles;

  return (
    <main className={styles.content}>
      <p className={styles.badge}>SSO · real Okta tenant · query-param page</p>
      <h1>{topic.label} articles</h1>
      <p>
        <strong>{topic.marker}.</strong> Served for{' '}
        <code>?category={categoryKey}&amp;sort={sortKey}</code>.
        {requestedCategory === undefined ? ' No category was given, so this is the default one.' : null}
        {requestedCategory !== undefined && !knownCategory
          ? ` There is no "${requestedCategory}" category, so this fell back to ${topic.label}.`
          : null}
        {requestedSort === undefined ? ' No sort was given, so this is the default order.' : null}
        {requestedSort !== undefined && !knownSort
          ? ` There is no "${requestedSort}" sort, so this fell back to ${sortKey}.`
          : null}
      </p>
      <p><strong>{SORTS[sortKey]}</strong></p>
      {topic.intro()}

      <h2>Topics</h2>
      <p>
        {Object.entries(TOPICS).map(([key, entry], index) => (
          <span key={key}>
            {index > 0 ? ' · ' : null}
            {key === categoryKey ? (
              <strong>{entry.label}</strong>
            ) : (
              <a href={`/okta/topic?category=${key}&sort=${sortKey}`}>{entry.label}</a>
            )}
          </span>
        ))}
      </p>

      <h2>Order</h2>
      <p>
        {Object.keys(SORTS).map((key, index) => (
          <span key={key}>
            {index > 0 ? ' · ' : null}
            {key === sortKey ? (
              <strong>{key}</strong>
            ) : (
              <a href={`/okta/topic?category=${categoryKey}&sort=${key}`}>{key}</a>
            )}
          </span>
        ))}
      </p>

      <h2>Articles in this topic</h2>
      <ul>
        {articles.map((article) => (
          <li key={article.href + article.title}>
            <a href={article.href}>{article.title}</a>, updated {article.updated}. {article.note}
          </li>
        ))}
      </ul>

      <p><a href="/okta/articles">Back to the help center</a></p>
    </main>
  );
}
