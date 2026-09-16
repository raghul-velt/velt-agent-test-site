import { apiError, invalidSession, isValidToken, readBearer, rejectVersion, unexpected } from '../../../../salesforce';
import { parseQuery, queryPage } from '../../../../soql';

/**
 * The SOQL query endpoint, first page.
 *
 * Bearer-checked before anything else is read, so an expired token never gets as far as
 * looking like a query problem. The 401 body is Salesforce's exact shape, an ARRAY holding
 * one object, because that is the response a connector's "is this a session problem or a
 * data problem" branch keys off.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ version: string }> },
): Promise<Response> {
  try {
    const { version } = await context.params;
    const badVersion = rejectVersion(version);
    if (badVersion) {
      return badVersion;
    }

    if (!(await isValidToken(readBearer(request)))) {
      return invalidSession();
    }

    const soql = new URL(request.url).searchParams.get('q') ?? '';
    if (soql.trim().length === 0) {
      return apiError(400, 'MALFORMED_QUERY', 'the q parameter is required');
    }

    const parsed = parseQuery(soql);
    if (parsed instanceof Response) {
      return parsed;
    }
    return queryPage(parsed, version, 0);
  } catch (error) {
    return unexpected(error);
  }
}
