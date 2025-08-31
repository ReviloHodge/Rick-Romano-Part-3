import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.SLEEPER_CLIENT_ID;
  const redirectUri = process.env.SLEEPER_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: 'Missing SLEEPER_CLIENT_ID or SLEEPER_REDIRECT_URI' },
      { status: 500 }
    );
  }

  const auth = new URL('https://api.sleeper.app/oauth/authorize');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('response_type', 'code');

  return NextResponse.redirect(auth.toString(), { status: 302 });
}
