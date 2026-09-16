import { invalidSession, isValidToken, json, readBearer, rejectVersion, unexpected } from '../../../../salesforce';

/**
 * The limits endpoint, which is what a connection test calls.
 *
 * It is the cheapest authenticated GET in the API, so almost every Salesforce client uses it
 * to answer "are these credentials good". That makes it the endpoint whose 401 a connector
 * will meet first, which is the reason it is bearer-checked here like everything else rather
 * than being left open as a health check.
 *
 * Real Salesforce returns a few dozen limits. Only the one a client reads is modelled.
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

    // Static. Nothing here counts calls, so a client cannot watch this number move.
    return json({ DailyApiRequests: { Max: 15000, Remaining: 14990 } });
  } catch (error) {
    return unexpected(error);
  }
}
