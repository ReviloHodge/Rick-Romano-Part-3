// app/api/auth/yahoo/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOrCreateUid } from '../../../../lib/user';
import { oauthExchange } from '../../../../lib/providers/yahoo';

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
 *
 * Dual-purpose:
 *  - If called WITHOUT ?code=: start the OAuth flow (redirect to Yahoo).
 *  - If called WITH    ?code=: handle callback, exchange code for tokens,
 *    stash tokens (stub), then redirect to /dashboard?provider=yahoo.
 *
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
  const code = url.searchParams.get('code');
  const debug = url.searchParams.get('debug') === '1';

  // --- Callback branch: Yahoo redirected back with ?code= ---
  if (code) {
    const stateParam = url.searchParams.get('state');     // set during start
    const userIdParam = url.searchParams.get('userId');   // optional override
    const uid = userIdParam ?? stateParam ?? null;

    try {
      const tokens = await oauthExchange(code); // Basic Auth done in provider impl
      if (tokens && uid) {
        // Minimal in-memory token store (replace with DB upsert in your app)
        const store =
          (globalThis as any).yahooTokenStore ??
          ((globalThis as any).yahooTokenStore = new Map<string, any>());
        store.set(uid, tokens);
      }
    } catch (err) {
      console.error('Yahoo oauthExchange failed:', err);
      // Proceed to redirect; surface an error toast via querystring later if you want
    }

    return NextResponse.redirect(new URL('/dashboard?provider=yahoo', req.url));
  }

  // --- Start-auth branch: build URL and redirect to Yahoo ---
  const userIdParam = url.searchParams.get('userId');
  const { uid, headers } = getOrCreateUid(req); // ensures a durable uid cookie
  const state = userIdParam ?? uid;

  const auth = buildAuth(clientId, redirectUri, state);

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
