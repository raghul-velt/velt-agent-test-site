import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import styles from '../../auth/auth.module.css';

/**
 * A tabbed guide chosen by the `tab` query parameter.
 *
 * The second shape a Salesforce community uses: one page whose visible content is picked by
 * a param, like its `?tabset-…=` addresses. Same rules as the article page: one marker and one
 * set of planted mistakes per tab, none shared, so a finding always names the tab it came
 * from. An unknown tab falls back to Install and says so.
 */

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface Tab {
  label: string;
  marker: string;
  body: () => ReactElement;
}

const TABS: Record<string, Tab> = {
  install: {
    label: 'Install',
    marker: 'OKTA-GUIDE-INSTALL-MARKER-9201',
    body: () => (
      <>
        <h2>Instalation</h2>
        <p>
          Instalation takes about ten minutes. Check the prerequisits first: you needs Node 20
          and a service account with read access to the audit log.
        </p>
        <ol>
          <li>Download the CLI from the <a href="https://get.technova-solutions.fake/cli">release page</a>.</li>
          <li>Run the installer and accept the defaults.</li>
          <li>Sign in with the service account when prompted.</li>
        </ol>
      </>
    ),
  },
  configure: {
    label: 'Configure',
    marker: 'OKTA-GUIDE-CONFIGURE-MARKER-9202',
    body: () => (
      <>
        <h2>Configuration</h2>
        <p>
          The configuartion file lives in a seperate folder per environment. The settings is read
          once at start-up, so restart the service after every change.
        </p>
        <ul>
          <li><code>alerts.window</code>, how long to wait before an upload counts as unacted</li>
          <li><code>alerts.channel</code>, where digests are posted</li>
          <li><code>audit.retention</code>, in days, defaults to ninty</li>
        </ul>
      </>
    ),
  },
  faq: {
    label: 'FAQ',
    marker: 'OKTA-GUIDE-FAQ-MARKER-9203',
    body: () => (
      <>
        <h2>Frequently asked questions</h2>
        <h3>Why does sign-in sometimes loop back to Okta?</h3>
        <p>
          Occassionally a stale session cookie is sent with the request. We recomend clearing the
          cookie and signing in again.
        </p>
        <h3>Why is the first request slow?</h3>
        <p>
          There is many reasons for a slow first request, the most common being a cold start. Later
          requests reuse the warm instance.
        </p>
      </>
    ),
  },
};

const DEFAULT_TAB = 'install';

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const requested = first((await searchParams).tab);
  const tab = TABS[requested ?? ''] ?? TABS[DEFAULT_TAB];
  return {
    title: `Guide: ${tab.label} — TechNova Help`,
    description: `The ${tab.label.toLowerCase()} tab of the setup guide.`,
  };
}

export default async function OktaGuidePage({ searchParams }: { searchParams: SearchParams }) {
  const requested = first((await searchParams).tab);
  const known = requested !== undefined && requested in TABS;
  const key = known ? (requested as string) : DEFAULT_TAB;
  const tab = TABS[key];

  return (
    <main className={styles.content}>
      <p className={styles.badge}>SSO · real Okta tenant · query-param page</p>
      <h1>Setup guide</h1>
      <p>
        <strong>{tab.marker}.</strong> Showing the {tab.label} tab
        {requested === undefined ? ' because no tab was given' : null}
        {requested !== undefined && !known ? ` because "${requested}" is not a tab` : null}.
      </p>
      <p>
        {Object.entries(TABS).map(([tabKey, entry], index) => (
          <span key={tabKey}>
            {index > 0 ? ' · ' : null}
            {tabKey === key ? (
              <strong>{entry.label}</strong>
            ) : (
              <a href={`/okta/guide?tab=${tabKey}`}>{entry.label}</a>
            )}
          </span>
        ))}
      </p>
      {tab.body()}
      <p><a href="/okta/articles">Back to the help center</a></p>
    </main>
  );
}
