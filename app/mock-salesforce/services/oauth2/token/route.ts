import { MOCK_SF_CLIENT_ID, MOCK_SF_CLIENT_SECRET } from '../../../../auth/credentials';
import { BASE_PATH, json, mintToken } from '../../../salesforce';

/**
 * The OAuth 2.0 client-credentials token endpoint, at Salesforce's own path.
 *
 * Mirroring the path is the whole trick: a connector configured with login URL
 * `https://velt-agent-full-test.vercel.app/mock-salesforce` appends
 * `/services/oauth2/token` exactly as it would against `login.salesforce.com`, so the
 * connector needs no mock-specific branch to be pointed here.
 *
 * Two details worth copying from the real thing, because both are easy to get wrong:
 *
 *  - there is NO `expires_in` in this flow. Salesforce does not send one, so a client that
 *    schedules a refresh off it will refresh never or immediately. The only correct strategy
 *    is to re-mint on a 401, which this mock forces it to do at least once an hour.
 *  - `instance_url` is NOT the login URL. Real orgs hand back a different host entirely, and
 *    a client that keeps calling the login host works right up until it meets a real org.
 *    Here it is the login URL plus nothing, but it is still read from the response body
 *    rather than assumed.
 */

/** A token-endpoint error, which is a single object rather than the REST API's array. */
function oauthError(error: string, description: string): Response {
  return json({ error, error_description: description }, 400);
}

/**
 * Reads the credentials out of the body.
 *
 * `application/x-www-form-urlencoded` is what the spec says and what every real client sends.
 * JSON is accepted too, because a hand-rolled client written against a JSON API tends to send
 * JSON here by reflex, and a confusing 400 at this step costs someone an afternoon.
 */
async function readParams(request: Request): Promise<URLSearchParams | null> {
  const contentType = request.headers.get('content-type') ?? '';
  const raw = await request.text();
  if (!contentType.includes('application/json')) {
    return new URLSearchParams(raw);
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        params.set(key, value);
      }
    }
    return params;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const params = await readParams(request);
    if (!params) {
      return oauthError('invalid_request', 'the request body could not be parsed');
    }

    const grantType = params.get('grant_type') ?? '';
    if (grantType !== 'client_credentials') {
      // Checked before the credentials, the way Salesforce does, so a client using the wrong
      // flow is told that rather than being sent hunting for a bad secret.
      return oauthError('unsupported_grant_type', `grant type not supported: ${grantType || '(missing)'}`);
    }

    const clientId = params.get('client_id') ?? '';
    const clientSecret = params.get('client_secret') ?? '';
    if (clientId !== MOCK_SF_CLIENT_ID || clientSecret !== MOCK_SF_CLIENT_SECRET) {
      return oauthError('invalid_client', 'invalid client credentials');
    }

    const origin = new URL(request.url).origin;
    const instanceUrl = `${origin}${BASE_PATH}`;
    return json({
      access_token: await mintToken(clientId, clientSecret),
      instance_url: instanceUrl,
      // Org id then user id, the shape of the real identity URL. Nothing serves it here.
      id: `${instanceUrl}/id/00DMOCK0000000001/005MOCK0000000001`,
      token_type: 'Bearer',
      issued_at: String(Date.now()),
      signature: 'mock',
    });
  } catch (error) {
    // The token endpoint's error shape is the OAuth one, not the REST API's array, so the
    // unexpected case is spelled out here rather than sharing the helper the data routes use.
    const detail = error instanceof Error ? error.message : 'unknown error';
    return json({ error: 'server_error', error_description: detail }, 500);
  }
}
