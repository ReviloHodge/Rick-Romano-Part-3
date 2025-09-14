import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/config/env';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const runtime = 'nodejs';

export async function GET() {
  const env = getEnv();
  const checks: Record<string, unknown> = {
    env: {
      NODE_ENV: env.NODE_ENV,
      hasYahooClientId: !!env.YAHOO_CLIENT_ID,
      hasYahooSecret: !!env.YAHOO_CLIENT_SECRET,
      hasYahooRedirect: !!env.YAHOO_REDIRECT_URI,
      SLEEPER_BASE_URL: env.SLEEPER_BASE_URL,
    },
  };

  // Disk write to token store path (touch a temp file in the same dir)
  try {
    const dir = dirname(env.YAHOO_TOKEN_STORE);
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/.diagnostic`, String(Date.now()), { encoding: 'utf8' });
    checks.disk = { tokenStoreDir: dir, writable: true };
  } catch (e) {
    checks.disk = { writable: false, error: (e as Error).message };
  }

  // Outbound TLS test (HEAD to example.com)
  try {
    const res = await fetch('https://example.com', { method: 'HEAD' });
    checks.outbound = { ok: res.ok, status: res.status };
  } catch (e) {
    checks.outbound = { ok: false, error: (e as Error).message };
  }

  return NextResponse.json({ status: 'ok', checks });
}

