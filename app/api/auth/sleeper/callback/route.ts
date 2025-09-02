import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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

  const next = new URL('/dashboard?provider=sleeper', req.url);
  if (!code) {
    next.searchParams.set('warn', 'no_code');
  }
  return NextResponse.redirect(next);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = body.code as string | undefined;
  const makeUrl = process.env.MAKE_CONNECTOR_URL;

  if (makeUrl && code) {
    fetch(makeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'sleeper', code }),
    }).catch(() => {});
  }

  const res: Record<string, unknown> = { ok: true, provider: 'sleeper' };
  if (!code) {
    res.warn = 'no_code';
  }
  return NextResponse.json(res);
}
