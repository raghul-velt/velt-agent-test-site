import styles from '../auth/auth.module.css';
import { PAGE_SIZE } from './salesforce';
import { MOCK_SF_CLIENT_ID, MOCK_SF_CLIENT_SECRET } from '../auth/credentials';

export const metadata = {
  title: 'Mock Salesforce API — TechNova Solutions',
  description: 'A stand-in Salesforce org for testing the Superflow Salesforce connector.',
};

/**
 * The human-readable half of the mock.
 *
 * Deliberately plain and deliberately outside every gate in proxy.ts. Whoever is configuring
 * the connector needs the credentials and the URL templates in front of them, and having them
 * on a page means nobody has to go and read the route handlers to find out what to paste.
 */
export default function MockSalesforcePage() {
  return (
    <main className={styles.content}>
      <p className={styles.badge}>no auth · mock Salesforce org</p>
      <h1>Mock Salesforce API</h1>
      <p>
        <strong>MOCK-SALESFORCE-MARKER-9700.</strong> This is not Salesforce. It is a stand-in
        for the two endpoints Superflow&apos;s Salesforce connector calls, so the connector can be
        built and tested without anyone owning an org. It impersonates Salesforce&apos;s paths
        exactly, so a connector configured with the login URL below needs no special case.
      </p>

      <h2>Login URL</h2>
      <p>
        <code>https://velt-agent-full-test.vercel.app/mock-salesforce</code>
      </p>
      <p>
        Everything under that prefix is open. There is no Okta in front of it, because the
        connector is a server with no browser and could never complete that round trip. The
        pages the records point at <em>are</em> behind Okta, which is the interesting part: the
        API tells you what to review, Site Access is what gets you in to review it.
      </p>

      <h2>Credentials</h2>
      <ul>
        <li>Consumer key: <code>{MOCK_SF_CLIENT_ID}</code></li>
        <li>Consumer secret: <code>{MOCK_SF_CLIENT_SECRET}</code></li>
        <li>Grant type: <code>client_credentials</code></li>
      </ul>
      <p>
        Overridable with <code>MOCK_SF_CLIENT_ID</code> and <code>MOCK_SF_CLIENT_SECRET</code> if
        you want to test the rejected-credentials path without editing code.
      </p>

      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>POST /mock-salesforce/services/oauth2/token</code>, form-encoded or JSON
        </li>
        <li>
          <code>GET /mock-salesforce/services/data/vNN.N/query?q=SOQL</code>
        </li>
        <li>
          <code>GET /mock-salesforce/services/data/vNN.N/query/CURSOR</code>, the next page
        </li>
        <li>
          <code>GET /mock-salesforce/services/data/vNN.N/limits</code>, the connection test
        </li>
      </ul>
      <p>
        Every endpoint except the token one wants <code>Authorization: Bearer &lt;token&gt;</code>.
        Without it the answer is <code>401</code> and Salesforce&apos;s exact body, an array:
        <code>{'[{"message":"Session expired or invalid","errorCode":"INVALID_SESSION_ID"}]'}</code>.
      </p>

      <h2>The token expires every hour, on purpose</h2>
      <p>
        The token is derived, not stored, because the functions serving this share no memory. It
        is <code>mock.</code> followed by base64url of the SHA-256 of
        <code> clientId:clientSecret:YYYY-MM-DDTHH</code> in UTC. Reads accept the current hour
        and the previous one, so a token is good for between one and two hours.
      </p>
      <p>
        That is not an accident of the design, it is the point. Salesforce does not return
        <code> expires_in</code> for the client-credentials flow and neither does this, so the
        only correct client strategy is to re-mint on a <code>401</code> and retry once. Here
        that path is exercised at least once an hour instead of never.
      </p>

      <h2>One record per object is always fresh</h2>
      <p>
        Article <code>102</code> and question <code>faq</code> carry the start of the current UTC
        hour as their <code>LastModifiedDate</code>. Everything else is pinned to a fixed date in
        August 2026. So a query filtered on{' '}
        <code>WHERE LastModifiedDate &gt; (an hour ago)</code> returns exactly one record per
        object, on any day, with no admin endpoint to poke the data first. That is what makes a
        &quot;review only the pages that changed&quot; flow demonstrable.
      </p>

      <h2>URL templates to configure in Superflow</h2>
      <ul>
        <li>
          Knowledge articles: <code>/okta/article?id={'{UrlName}'}</code>
        </li>
        <li>
          Community questions: <code>/okta/guide?tab={'{Id}'}</code>
        </li>
      </ul>
      <p>
        The <code>FeedItem</code> ids are <code>install</code>, <code>configure</code> and{' '}
        <code>faq</code> rather than 18-character Salesforce ids. That is deliberate: the
        template has to land on a page that really exists on this site.
      </p>

      <h2>Objects and paging</h2>
      <ul>
        <li>
          <code>Knowledge__kav</code>, also answered for <code>KnowledgeArticleVersion</code>:
          three articles, <code>UrlName</code> 101, 102, 103.
        </li>
        <li>
          <code>FeedItem</code>: three <code>QuestionPost</code> records, ids{' '}
          <code>install</code>, <code>configure</code>, <code>faq</code>.
        </li>
      </ul>
      <p>
        Pages hold {PAGE_SIZE} records (<code>MOCK_SF_PAGE_SIZE</code>), so three records always
        split into two pages and a client that ignores <code>nextRecordsUrl</code> loses one
        rather than passing by luck. <code>nextRecordsUrl</code> is a path relative to
        <code> instance_url</code>, exactly as Salesforce sends it.
      </p>

      <p>
        <a href="/okta/articles">The pages these records point at</a> (Okta sign-in required)
      </p>
    </main>
  );
}
