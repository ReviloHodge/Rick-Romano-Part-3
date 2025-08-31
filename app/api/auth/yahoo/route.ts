// app/api/auth/yahoo/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOrCreateUid } from '../../../../lib/user';

/**
 * Build Yahoo OAuth authorize URL.
 * Required params: client_id, redirect_uri, response_type=code, scope, state
 * We include 'openid fspt-r' so Fantasy Sports read access works.
 */
function buildAuth(clientId: string, redirectUri: string, state: string) {
  const auth = new URL('https://api.login.yahoo.com/oauth2/request_auth');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', 'openid fspt-r');
  auth.searchParams.set('language', 'en-us');
  auth.searchParams.set('state', state);
  return auth;
}

/**
 * GET /api/auth/yahoo
 * Starts the OAuth flow by redirecting to Yahoo with a stable `state`.
 * `state` is the anonymous uid cookie (or `userId` query param if provided).
 * Supports ?debug=1 to return the built URL as JSON instead of redirecting.
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const redirectUri = process.env.YAHOO_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: 'Missing YAHOO_CLIENT_ID or YAHOO_REDIRECT_URI' },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const debug = url.searchParams.get('debug') === '1';
  const userIdParam = url.searchParams.get('userId');

  // Ensure we have a durable uid cookie we can reuse as OAuth state
  const { uid, headers } = getOrCreateUid(req);
  const state = userIdParam ?? uid;

  const auth = buildAuth(clientId, redirectUri, state);

  // If debug, return the URL + state as JSON and also set any cookie headers
  if (debug) {
    return new NextResponse(
      JSON.stringify({ ok: true, auth: auth.toString(), state }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          ...(headers ?? {}),
        },
      }
    );
  }

  // Normal path: redirect to Yahoo and include any cookie headers from getOrCreateUid
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: auth.toString(),
      ...(headers ?? {}),
    },
  });
}

/**
 * POST /api/auth/yahoo
 * Optional helper that returns the built authorize URL as JSON (no redirect).
 * Useful for programmatic clients or local testing.
 */
export async function POST(req: NextRequest) {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const redirectUri = process.env.YAHOO_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: 'Missing YAHOO_CLIENT_ID or YAHOO_REDIRECT_URI' },
      { status: 500 }
    );
  }

  const { uid, headers } = getOrCreateUid(req);
  const auth = buildAuth(clientId, redirectUri, uid);

  return new NextResponse(
    JSON.stringify({ ok: true, auth: auth.toString(), state: uid }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        ...(headers ?? {}),
      },
    }
  );
}
