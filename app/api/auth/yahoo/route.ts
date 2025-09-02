export const runtime = 'nodejs';
// app/api/auth/yahoo/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOrCreateUid } from '../../../../lib/user';
import { buildAuth, oauthExchange } from '../../../../lib/providers/yahoo';
import { encryptToken } from '../../../../lib/security';
import { getSupabaseAdmin } from '../../../../lib/db';
import { track } from '../../../../lib/metrics';


function parseCookie(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};
  cookieHeader.split(';').forEach(part => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(rest.join('=') ?? '');
  });
  return out;
}

/**
 * GET /api/auth/yahoo
 * - Without ?code=: start OAuth (redirect to Yahoo).
 * - With    ?code=: handle callback, exchange tokens, upsert, redirect to dashboard.
 * Supports ?debug=1 to return the built URL as JSON instead of redirect.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const debug = url.searchParams.get('debug') === '1';

  // --- Callback branch ---
  if (code) {
    const stateParam = url.searchParams.get('state');
    const cookies = parseCookie(req.headers.get('cookie'));
    if (!stateParam || cookies['y_state'] !== stateParam) {
      return new NextResponse('Invalid state', { status: 400 });
    }
    const userIdParam = url.searchParams.get('userId');
    const { uid: cookieUid } = getOrCreateUid(req);
    const uid = userIdParam ?? stateParam ?? cookieUid ?? null;
    const errors: string[] = [];
    if (!uid) errors.push('no_uid');

    try {
      const tokens = await oauthExchange(code); // implemented in lib/providers/yahoo.ts
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
        if (error) {
          console.error('Supabase upsert error (yahoo tokens):', error);
          errors.push('db_upsert');
        } else {
          track?.('oauth_success', uid, { provider: 'yahoo' });
        }
      }
    } catch (err) {
      console.error('Yahoo oauthExchange failed:', err);
      errors.push('oauth_exchange');
    }

    const next = new URL('/dashboard?provider=yahoo', req.url);
    if (errors.length > 0) {
      next.searchParams.set('error', errors.join(','));
    }
    const res = NextResponse.redirect(next);
    res.headers.append('Set-Cookie', 'y_state=; Path=/; Max-Age=0');
    return res;
  }

  // --- Start-auth branch ---
  const userIdParam = url.searchParams.get('userId');
  const { uid } = getOrCreateUid(req);
  const state = userIdParam ?? uid;

  const auth = buildAuth(state);

  const uidCookie = [
    `uid=${encodeURIComponent(uid)}`,
    'Path=/',
    'SameSite=Lax',
    'HttpOnly',
    'Secure',
    `Max-Age=${60 * 60 * 24 * 365}`,
  ].join('; ');

  const stateCookie = [
    `y_state=${encodeURIComponent(state)}`,
    'Path=/',
    'SameSite=Lax',
    'HttpOnly',
    'Secure',
    `Max-Age=${60 * 10}`,
  ].join('; ');

  if (debug) {
    const headers = new Headers({ 'content-type': 'application/json' });
    headers.append('Set-Cookie', uidCookie);
    headers.append('Set-Cookie', stateCookie);
    return new NextResponse(
      JSON.stringify({ ok: true, auth: auth.toString(), state }),
      { status: 200, headers }
    );
  }

  const headers = new Headers({ Location: auth.toString() });
  headers.append('Set-Cookie', uidCookie);
  headers.append('Set-Cookie', stateCookie);
  return new NextResponse(null, { status: 302, headers });
}

/**
 * POST /api/auth/yahoo
 * Return the built authorize URL as JSON (no redirect).
 */
export async function POST(req: NextRequest) {
  const { uid } = getOrCreateUid(req);
  const auth = buildAuth(uid);

  const uidCookie = [
    `uid=${encodeURIComponent(uid)}`,
    'Path=/',
    'SameSite=Lax',
    'HttpOnly',
    'Secure',
    `Max-Age=${60 * 60 * 24 * 365}`,
  ].join('; ');

  const stateCookie = [
    `y_state=${encodeURIComponent(uid)}`,
    'Path=/',
    'SameSite=Lax',
    'HttpOnly',
    'Secure',
    `Max-Age=${60 * 10}`,
  ].join('; ');

  const headers = new Headers({ 'content-type': 'application/json' });
  headers.append('Set-Cookie', uidCookie);
  headers.append('Set-Cookie', stateCookie);

  return new NextResponse(
    JSON.stringify({ ok: true, auth: auth.toString(), state: uid }),
    { status: 200, headers }
  );
}
