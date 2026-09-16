import { MOCK_SF_CLIENT_ID, MOCK_SF_CLIENT_SECRET } from '../auth/credentials';

/**
 * The shared half of the mock Salesforce API.
 *
 * Superflow's Salesforce connector signs in with the OAuth 2.0 client-credentials flow and
 * then lists a help site's pages over SOQL. Nobody on the team has an org to point staging
 * at, so this site impersonates the two endpoints the connector actually calls, and every
 * record it hands back names a page that already exists here:
 *
 *   Knowledge__kav.UrlName -> /okta/article?id=<UrlName>
 *   FeedItem.Id            -> /okta/guide?tab=<Id>
 *
 * Everything lives under /mock-salesforce, which is deliberately OUTSIDE proxy.ts's matcher.
 * The connector is a server talking to a server: it has no browser and cannot complete the
 * Okta round trip, so the API has to answer without a session even though the pages it names
 * are behind Okta. Keeping the mock out of the gate is the whole reason it is useful.
 */

/** The prefix a connector configures as its login URL, and what instance_url points at. */
export const BASE_PATH = '/mock-salesforce';

/**
 * Rows per page. Two, so three records always split into two pages and a connector that
 * ignores nextRecordsUrl visibly loses a record rather than passing by luck.
 */
export const PAGE_SIZE = Number(process.env.MOCK_SF_PAGE_SIZE ?? '2') || 2;

/* ------------------------------------------------------------------ responses */

/** JSON with the header Salesforce actually sends, so a strict client is happy. */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/**
 * A Salesforce REST error, which is an ARRAY of objects rather than a single object.
 * Clients written against the shape of the token endpoint get this wrong, so it is worth
 * having something to test against.
 */
export function apiError(status: number, errorCode: string, message: string): Response {
  return json([{ message, errorCode }], status);
}

/** What every data endpoint answers with when the bearer token is missing or stale. */
export function invalidSession(): Response {
  return apiError(401, 'INVALID_SESSION_ID', 'Session expired or invalid');
}

/** The last-resort answer, so an unexpected throw is still a shape the client can read. */
export function unexpected(error: unknown): Response {
  const detail = error instanceof Error ? error.message : 'unknown error';
  return apiError(500, 'UNKNOWN_EXCEPTION', `The mock Salesforce API failed: ${detail}`);
}

/* --------------------------------------------------------------------- tokens */

/** base64url, the padding-free alphabet both the token and the paging cursor use. */
export function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
}

/** The UTC hour a token is bound to, e.g. `2026-09-16T10`. */
function hourKey(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 3_600_000).toISOString().slice(0, 13);
}

/**
 * Mints the access token for a given hour.
 *
 * Derived rather than stored. Vercel functions share no memory, so a token kept in a map on
 * one instance would be rejected by the next one, and the connector would see random 401s
 * that look like a bug in its own retry logic.
 *
 * Binding the hash to the UTC hour is what gives the token a lifetime without a store: it
 * stops being mintable once the hour rolls over. Reads accept the previous hour as well, so
 * the window is between one and two hours and a request that straddles the boundary does not
 * fail. Every hour the connector therefore gets a real "401, re-mint once, retry" path to
 * exercise, which is the part of an OAuth client that is never tested until it breaks.
 */
export async function mintToken(clientId: string, clientSecret: string, hoursAgo = 0): Promise<string> {
  const material = `${clientId}:${clientSecret}:${hourKey(hoursAgo)}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
  return `mock.${base64Url(new Uint8Array(digest))}`;
}

/** Constant-time-ish comparison, mirroring the one in app/auth/sso.ts. */
function equals(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let differences = 0;
  for (let index = 0; index < left.length; index += 1) {
    differences |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return differences === 0;
}

/** Reads `Authorization: Bearer ...`, returning an empty string when there is nothing to read. */
export function readBearer(request: Request): string {
  const header = request.headers.get('authorization') ?? '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}

/** True when the token is one this deployment would have minted this hour or last hour. */
export async function isValidToken(token: string): Promise<boolean> {
  if (!token.startsWith('mock.')) {
    return false;
  }
  const current = await mintToken(MOCK_SF_CLIENT_ID, MOCK_SF_CLIENT_SECRET, 0);
  const previous = await mintToken(MOCK_SF_CLIENT_ID, MOCK_SF_CLIENT_SECRET, 1);
  return equals(token, current) || equals(token, previous);
}

/* --------------------------------------------------------------------- records */

/** Salesforce serialises datetimes with a numeric `+0000` offset, not with `Z`. */
function sfDate(milliseconds: number): string {
  return new Date(milliseconds).toISOString().replace('Z', '+0000');
}

/**
 * The start of the current UTC hour.
 *
 * One record per object carries this instead of a fixed date, so it reads as freshly changed
 * every hour. That is what lets a "review only the pages that changed" flow be demonstrated
 * on any day of the year without an admin endpoint to poke the data: ask for
 * `LastModifiedDate > <an hour ago>` and exactly one record comes back.
 */
export function currentHour(): string {
  return sfDate(Math.floor(Date.now() / 3_600_000) * 3_600_000);
}

export type SObjectRecord = Record<string, unknown> & {
  attributes: { type: string; url: string };
};

/** The two objects this mock knows about, plus the alias Salesforce itself still answers to. */
const OBJECTS: Record<string, 'Knowledge__kav' | 'FeedItem'> = {
  knowledge__kav: 'Knowledge__kav',
  knowledgearticleversion: 'Knowledge__kav',
  feeditem: 'FeedItem',
};

export function resolveObject(name: string): 'Knowledge__kav' | 'FeedItem' | undefined {
  return OBJECTS[name.toLowerCase()];
}

function attributes(type: string, version: string, id: string): SObjectRecord['attributes'] {
  return { type, url: `/services/data/${version}/sobjects/${type}/${id}` };
}

/**
 * The knowledge articles, mirroring /okta/article?id=101|102|103.
 *
 * 101 and 103 are pinned to August 2026 so a "changed since yesterday" query never returns
 * them. Note that /okta/article's own "Last updated" line for 101 says 12 September 2026;
 * the mock uses an August date on purpose so that 102 is the only record a recency filter
 * can match, and the two dates are not meant to agree.
 *
 * The ids read like Salesforce ids without being valid ones: a real key prefix is 3 chars and
 * the whole id is 15 or 18, these are 20 so the article number stays legible in a log. A
 * client that validates id length will reject them, which is worth finding out here.
 */
function knowledgeRecords(version: string): SObjectRecord[] {
  const rows = [
    { key: '101', title: 'Set up SharePoint upload alerts', date: '2026-08-21T09:12:00.000+0000' },
    { key: '102', title: 'Rotate API keys without downtime', date: currentHour() },
    { key: '103', title: 'Reading the audit log', date: '2026-08-28T16:40:00.000+0000' },
  ];
  return rows.map((row) => ({
    attributes: attributes('Knowledge__kav', version, `ka0MOCK0000000${row.key}AAA`),
    Id: `ka0MOCK0000000${row.key}AAA`,
    KnowledgeArticleId: `kA0MOCK0000000${row.key}AAA`,
    // The page key. A connector builds /okta/article?id={UrlName} from this, which is how a
    // record in a fake org ends up pointing at a page that really exists on this site.
    UrlName: row.key,
    Title: row.title,
    PublishStatus: 'Online',
    Language: 'en_US',
    LastPublishedDate: row.date,
    LastModifiedDate: row.date,
  }));
}

/**
 * The community questions, mirroring /okta/guide?tab=install|configure|faq.
 *
 * A real Salesforce Id is 15 or 18 characters. These are the tab names instead, deliberately,
 * because the whole point is that the URL template `/okta/guide?tab={Id}` has to land on a
 * page that exists. A connector that validates Id length will reject these, which is itself
 * worth finding out here rather than in front of a customer.
 */
function feedItemRecords(version: string): SObjectRecord[] {
  const rows = [
    {
      id: 'install',
      title: 'How do I install the CLI?',
      body: 'Instalation takes about ten minutes. Which prerequisits do I need before I start?',
      date: '2026-08-19T11:05:00.000+0000',
    },
    {
      id: 'configure',
      title: 'Where does the configuration file live?',
      body: 'The configuartion file seems to be per environment. Do I restart after every change?',
      date: '2026-08-26T14:30:00.000+0000',
    },
    {
      id: 'faq',
      title: 'Why does sign-in sometimes loop back to Okta?',
      body: 'Occassionally the sign-in loops. Is clearing the session cookie the right fix?',
      date: currentHour(),
    },
  ];
  return rows.map((row) => ({
    attributes: attributes('FeedItem', version, row.id),
    Id: row.id,
    Type: 'QuestionPost',
    Title: row.title,
    Body: row.body,
    NetworkScope: '0DBMOCK0000000001',
    CreatedDate: '2026-08-12T08:00:00.000+0000',
    LastModifiedDate: row.date,
  }));
}

export function recordsFor(object: 'Knowledge__kav' | 'FeedItem', version: string): SObjectRecord[] {
  return object === 'Knowledge__kav' ? knowledgeRecords(version) : feedItemRecords(version);
}

/**
 * Rejects an API version this mock would not serve.
 *
 * Salesforce answers a version it does not have with a 404, so a connector configured with
 * `v99` or a bare `59.0` finds out here rather than getting a cheerfully wrong answer. Any
 * well-formed `vNN.N` is accepted and echoed back in the record urls, because the point is to
 * test the client's version handling, not to model a release schedule.
 */
export function rejectVersion(version: string): Response | null {
  return /^v\d+(\.\d+)?$/i.test(version)
    ? null
    : apiError(404, 'NOT_FOUND', `The requested resource does not exist: ${version}`);
}
