import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(req: Request) {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const redirectUri = process.env.YAHOO_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    // Fail loudly so you know envs are missing
    return NextResponse.json(
      { ok: false, error: 'Missing YAHOO_CLIENT_ID or YAHOO_REDIRECT_URI' },
      { status: 500 }
    );
  }

  // Minimal CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  cookies().set('y_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 min
  });

  const auth = new URL('https://api.login.yahoo.com/oauth2/request_auth');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('language', 'en-us');
  auth.searchParams.set('scope', 'openid fspt-r'); // read-only Fantasy Sports
  auth.searchParams.set('state', state);

  return NextResponse.redirect(auth.toString(), { status: 302 });
}
