import { NextRequest, NextResponse } from 'next/server';
import { track } from '@/lib/metrics';

export async function POST(req: NextRequest) {
  try {
    const { event, userId, properties } = await req.json();
    if (!event) {
      return NextResponse.json({ ok: false, error: 'missing event' }, { status: 400 });
    }
    track(event, userId, properties);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
