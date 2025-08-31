// app/api/auth/yahoo/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOrCreateUid } from '../../../../lib/user';
import { oauthExchange } from '../../../../lib/providers/yahoo';
import { encryptToken } from '../../../../lib/security';
import { getSupabaseAdmin } from '../../../../lib/db';
import { track } from '../../../../lib/metrics';

/** Build Yahoo OAuth authorize URL */
function buildAuth(clientId: string, redirectUri: string, state: string) {
  const auth = new URL('https://api.login.yahoo.com/oauth2/request_auth');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', 'openid fspt-r'); // Fantasy Sports read
  auth.searchParams.set('language', 'en-us');
  auth.searchParams.set('state', state);
  return auth;
}

/**
 * GET /api/auth/yahoo
 *
 * Dual-purpose:
 *  - If called WITHOUT ?code=: start OAuth (redirect to Yahoo).
 *  - If called WITH    ?code=: handle callback, exchange tokens, upsert to DB,
 *    then redirect to /dashboard?provider=yahoo.
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
    const { uid: cookieUid } = getOrCreateUid(req);
    const uid = userIdParam ?? stateParam ?? cookieUid ?? null;

    try {
      const tokens = await oauthExchange(code); // implements Basic auth + form body
      if (tokens && uid) {
        const supabase = getSupabaseAdmin();
        const access_enc = await encryptToken(tokens.access_token);
        const refresh_enc = tokens.refresh_token
          ? await encryptToken(tokens.refresh_token)
          : null;
        const expires_at = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null;

        const { error } = await supabase.from('league_connection').upsert({
          user_id: uid,
          provider: 'yahoo',
          access_token_enc: access_enc,
          refresh_token_enc: refresh_enc,
          expires_at,
        });
        if (error) console.error('Supabase upsert error (yahoo tokens):', error);
        else track?.('oauth_success', uid, { provider: 'yahoo' });
      }
    } catch (err) {
      console.error('Yahoo oauthExchange failed:', err);
      // continue; dashboard can show an error toast if desired
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
        headers: { 'content-type': 'application/json', ...(headers ?? {}) },
      }
    );
  }

  return new NextResponse(null, {
    status: 302,
    headers: { Location: auth.toString(), ...(headers ?? {}) },
  });
}

/**
 * POST /api/auth/yahoo
 * Optional helper that returns the built authorize URL as JSON (no redirect).
 */
export async function POST(req: NextRequest) {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const redirectUri = process.env.YAHOO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextRespon
