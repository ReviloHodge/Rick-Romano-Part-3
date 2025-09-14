import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
const startedAt = Date.now();

export async function GET() {
  const uptimeSec = Math.round((Date.now() - startedAt) / 1000);
  return NextResponse.json({ status: 'ok', version: process.env.npm_package_version || '0.0.0', uptime: uptimeSec });
}

