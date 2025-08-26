import { NextResponse } from 'next/server';

async function ping(trigger: 'GET'|'POST') {
  const url = process.env.MAKE_CONNECTOR_URL || process.env.NEXT_PUBLIC_MAKE_CONNECTOR_URL;
  if (!url) return new NextResponse('MAKE_CONNECTOR_URL not set', { status: 500 });

  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ ping: true, trigger, ts: Date.now(), from: 'vercel' }),
  });
  const text = await res.text();
  return NextResponse.json({ ok: res.ok, status: res.status, bodyPreview: text.slice(0, 400) });
}

export async function GET()  { return ping('GET');  }
export async function POST() { return ping('POST'); }
