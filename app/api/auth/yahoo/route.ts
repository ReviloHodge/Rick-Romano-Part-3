import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOrCreateUid } from '../../../../lib/user';

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
  const { uid, headers } = getOrCreateUid(req);
  const userId = userIdParam ?? uid;

  const auth = new URL('https://api.login.yahoo.com/oauth2/request_auth');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', 'openid fspt-r');
  auth.searchParams.set('language', 'en-us');
  auth.searchParams.set('state', userId);

  const init = headers ? { headers } : undefined;
  if (debug) {
    return NextResponse.json({ ok: true, auth: auth.toString() }, init);
  }
  return NextResponse.redirect(auth.toString(), { status: 302, ...(init || {}) });
}
