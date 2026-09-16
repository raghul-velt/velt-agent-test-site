import { PAGE_SIZE, apiError, fromBase64Url, base64Url, json, recordsFor, resolveObject } from './salesforce';

/**
 * The SOQL half of the mock.
 *
 * This is not a SOQL parser and is not trying to be one. A connector that lists a help site's
 * pages only ever asks three things: which object, how many rows, and what changed since when.
 * Those three are read with regexes and everything else in the query is ignored, which means a
 * connector can send its real SELECT list, its real ORDER BY and its real WHERE clause and
 * still get a sensible answer. The cost is that a broken query is answered rather than
 * rejected, so this mock will never catch a SOQL syntax error for you.
 */

export interface ParsedQuery {
  object: 'Knowledge__kav' | 'FeedItem';
  /** The LIMIT, applied to the whole result set before it is paged. */
  limit: number | null;
  /** The right-hand side of a `LastModifiedDate > ...` or `LastPublishedDate > ...` comparison. */
  since: string | null;
  /** Which of the two date fields the filter named, so the right one is compared. */
  sinceField: string | null;
}

const FROM_PATTERN = /\bfrom\s+([a-z0-9_]+)/i;
const LIMIT_PATTERN = /\blimit\s+(\d+)\b/i;
// Salesforce datetime literals are unquoted in SOQL, but plenty of clients quote them anyway,
// so both are accepted here rather than silently dropping the filter.
const SINCE_PATTERN =
  /\b(lastmodifieddate|lastpublisheddate)\s*>=?\s*'?(\d{4}-\d{2}-\d{2}T[\d:.]+(?:z|[+-]\d{2}:?\d{2})?)'?/i;

/** Parses a query, or returns the Salesforce error the real API would answer with. */
export function parseQuery(soql: string): ParsedQuery | Response {
  const from = FROM_PATTERN.exec(soql);
  if (!from) {
    return apiError(400, 'MALFORMED_QUERY', "unexpected token: the query has no FROM clause");
  }
  const object = resolveObject(from[1]);
  if (!object) {
    return apiError(400, 'INVALID_TYPE', `sObject type '${from[1]}' is not supported.`);
  }
  const limit = LIMIT_PATTERN.exec(soql);
  const since = SINCE_PATTERN.exec(soql);
  return {
    object,
    limit: limit ? Number(limit[1]) : null,
    since: since ? since[2] : null,
    sinceField: since ? since[1] : null,
  };
}

/* --------------------------------------------------------------------- cursors */

interface Cursor {
  /** Object name. */
  o: string;
  /** Offset of the next page. */
  n: number;
  /** The parsed filter, carried along so page two is filtered exactly like page one. */
  f: string | null;
  d: string | null;
  /** The LIMIT, for the same reason. */
  l: number | null;
}

/**
 * Encodes the cursor as base64url JSON.
 *
 * Real Salesforce cursors look like `01gRO0000016PIAYA2-2000`: a query locator id plus a row
 * offset, backed by server state. There is no server state here, so the whole query context
 * travels inside the cursor instead. A connector must treat it as opaque either way, which is
 * the behaviour this is really testing. The one visible difference is length.
 */
function encodeCursor(cursor: Cursor): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(cursor)));
}

export function decodeCursor(value: string): ParsedQuery & { offset: number } | null {
  try {
    const parsed = JSON.parse(fromBase64Url(value)) as Partial<Cursor>;
    const object = typeof parsed.o === 'string' ? resolveObject(parsed.o) : undefined;
    if (!object || typeof parsed.n !== 'number') {
      return null;
    }
    return {
      object,
      offset: parsed.n,
      limit: typeof parsed.l === 'number' ? parsed.l : null,
      since: typeof parsed.f === 'string' ? parsed.f : null,
      sinceField: typeof parsed.d === 'string' ? parsed.d : null,
    };
  } catch {
    // A cursor this deployment did not mint is simply not a cursor.
    return null;
  }
}

/* ----------------------------------------------------------------------- pages */

/**
 * Builds one page of a query result.
 *
 * `totalSize` is the count of every matching row, not the count on this page, which is what
 * real Salesforce reports and what makes a progress bar work. `done` is false exactly when a
 * `nextRecordsUrl` is present, and that URL is a PATH relative to instance_url, again the way
 * Salesforce does it: the client is expected to join it onto the instance_url it was given at
 * token time rather than treat it as absolute.
 */
export function queryPage(query: ParsedQuery, version: string, offset: number): Response {
  let records = recordsFor(query.object, version);

  if (query.since) {
    const threshold = Date.parse(query.since);
    const field = query.sinceField?.toLowerCase() === 'lastpublisheddate' ? 'LastPublishedDate' : 'LastModifiedDate';
    records = records.filter((record) => {
      // FeedItem has no LastPublishedDate, so a query that asks for it falls back to the
      // modified date rather than erroring. Real Salesforce would answer INVALID_FIELD.
      const value = (record[field] ?? record.LastModifiedDate) as string;
      return Date.parse(value) > threshold;
    });
  }

  if (query.limit !== null) {
    records = records.slice(0, query.limit);
  }

  const page = records.slice(offset, offset + PAGE_SIZE);
  const nextOffset = offset + page.length;
  const done = nextOffset >= records.length;

  return json({
    totalSize: records.length,
    done,
    records: page,
    ...(done
      ? {}
      : {
          nextRecordsUrl: `/services/data/${version}/query/${encodeCursor({
            o: query.object,
            n: nextOffset,
            f: query.since,
            d: query.sinceField,
            l: query.limit,
          })}`,
        }),
  });
}
