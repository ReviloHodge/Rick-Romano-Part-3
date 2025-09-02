import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const userId = url.searchParams.get('state');

  const makeUrl = process.env.MAKE_CONNECTOR_URL;
  if (makeUrl && code) {
    fetch(makeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'yahoo', code, userId }),
    }).catch(() => {});
  }

  const next = new URL('/dashboard?provider=yahoo', req.url);
  if (!code) {
    next.searchParams.set('warn', 'no_code');
  }
  return NextResponse.redirect(next);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = body.code as string | undefined;
  const state = body.state as string | undefined;
  const cookieState = cookies().get('y_state')?.value;

  if (cookieState && state && cookieState !== state) {
    return NextResponse.json(
      { ok: false, error: 'state_mismatch' },
      { status: 400 }
    );
  }
  cookies().delete('y_state');

  const makeUrl = process.env.MAKE_CONNECTOR_URL;
  if (makeUrl && code) {
    fetch(makeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'yahoo', code }),
    }).catch(() => {});
  }

  const res: Record<string, unknown> = { ok: true, provider: 'yahoo' };
  if (!code) {
    res.warn = 'no_code';
  }
  return NextResponse.json(res);
}
