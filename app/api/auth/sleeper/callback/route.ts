import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const makeUrl = process.env.MAKE_CONNECTOR_URL;

  if (makeUrl && code) {
    fetch(makeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'sleeper', code }),
    }).catch(() => {});
  }

  const next = new URL('/dashboard?connected=sleeper', req.url);
  if (!code) {
    next.searchParams.set('warn', 'no_code');
  }
  return NextResponse.redirect(next);
}
