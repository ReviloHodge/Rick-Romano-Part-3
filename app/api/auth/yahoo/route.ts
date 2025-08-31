import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { oauthExchange } from '../../../../lib/providers/yahoo';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const userId = url.searchParams.get('userId');
  const stateParam = url.searchParams.get('state');
  const debug = url.searchParams.get('debug') === '1';

  if (code) {
    const tokens = await oauthExchange(code);
    const uid = userId || stateParam;
    if (tokens && uid) {
      const store = (globalThis as any).yahooTokenStore ||
        ((globalThis as any).yahooTokenStore = new Map<string, any>());
      store.set(uid, tokens);
    }
    return NextResponse.redirect(new URL('/dashboard?provider=yahoo', req.url));
  }

  const clientId = process.env.YAHOO_CLIENT_ID;
  const redirectUri = process.env.YAHOO_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: 'Missing YAHOO_CLIENT_ID or YAHOO_REDIRECT_URI' },
      { status: 500 }
    );
  }

  const state = userId || crypto.randomBytes(16).toString('hex');

  const auth = new URL('https://api.login.yahoo.com/oauth2/request_auth');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', 'fspt-r');
  auth.searchParams.set('language', 'en-us');
  auth.searchParams.set('state', state);

  if (debug) {
    return NextResponse.json({ ok: true, auth: auth.toString() });
  }
  return NextResponse.redirect(auth.toString(), { status: 302 });
}
