import { NextResponse } from 'next/server';
import { exchangeCodeAndPersist } from '@/lib/integrations/yahooAuth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ ok: false, error: 'missing_code' }, { status: 400 });
  }
  try {
    await exchangeCodeAndPersist(code);
    return new NextResponse('Success, you can close this window.', { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'exchange_failed' }, { status: 500 });
  }
}

