import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const clientId = process.env.SLEEPER_CLIENT_ID;
  const redirectUri = process.env.SLEEPER_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.redirect(
      new URL('/dashboard?provider=sleeper', req.url)
    );
  }

  const auth = new URL('https://api.sleeper.app/oauth/authorize');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('response_type', 'code');

  return NextResponse.redirect(auth.toString(), { status: 302 });
}

export async function POST(req: Request) {
  const clientId = process.env.SLEEPER_CLIENT_ID;
  const redirectUri = process.env.SLEEPER_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ ok: true, provider: 'sleeper', stub: true });
  }

  const auth = new URL('https://api.sleeper.app/oauth/authorize');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('response_type', 'code');

  return NextResponse.json({ ok: true, auth: auth.toString() });
}
