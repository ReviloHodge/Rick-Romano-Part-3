import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = cookies().get('y_state')?.value;

  // Basic state check (don’t block MVP if absent, just warn)
  if (cookieState && state && cookieState !== state) {
    return NextResponse.redirect(new URL('/dashboard?error=state_mismatch', req.url));
  }
  cookies().delete('y_state');

  // Fire Make CONNECTOR (token exchange happens there)
  const makeUrl = process.env.MAKE_CONNECTOR_URL;
  if (makeUrl && code) {
    // fire-and-forget; we don't wait for it
    fetch(makeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'yahoo', code }),
    }).catch(() => {});
  }

  // Land the user
  const next = new URL('/dashboard?connected=yahoo', req.url);
  if (!code) {
    next.searchParams.set('warn', 'no_code'); // helps debugging if needed
  }
  return NextResponse.redirect(next);
}
