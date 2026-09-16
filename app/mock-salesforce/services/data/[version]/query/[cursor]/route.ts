import { apiError, invalidSession, isValidToken, readBearer, rejectVersion, unexpected } from '../../../../../salesforce';
import { decodeCursor, queryPage } from '../../../../../soql';

/**
 * The SOQL query endpoint, every page after the first.
 *
 * This is the path a client reaches by joining the `nextRecordsUrl` from the previous page
 * onto its instance_url. It carries no `q`: the query context is inside the cursor, which is
 * why paging keeps the filter and the LIMIT without any server state.
 *
 * A cursor this deployment did not mint is answered with `INVALID_QUERY_LOCATOR`, which is
 * what Salesforce says when a locator has expired. A client that stores a nextRecordsUrl and
 * comes back to it much later gets that in production, so it should have a path for it.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ version: string; cursor: string }> },
): Promise<Response> {
  try {
    const { version, cursor } = await context.params;
    const badVersion = rejectVersion(version);
    if (badVersion) {
      return badVersion;
    }

    if (!(await isValidToken(readBearer(request)))) {
      return invalidSession();
    }

    const decoded = decodeCursor(cursor);
    if (!decoded) {
      return apiError(400, 'INVALID_QUERY_LOCATOR', 'invalid query locator');
    }

    const { offset, ...query } = decoded;
    return queryPage(query, version, offset);
  } catch (error) {
    return unexpected(error);
  }
}
