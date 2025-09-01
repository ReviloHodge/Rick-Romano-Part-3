import type { NextRequest } from 'next/server';

function parseCookie(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};
  cookieHeader.split(';').forEach(part => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(rest.join('=') ?? '');
  });
  return out;
}

/**
 * Returns a durable anonymous user id and headers to persist it.
 * Usage:
 *   const { uid, headers } = getOrCreateUid(req);
 *   return NextResponse.redirect(url, { headers });
 */
export function getOrCreateUid(
  req: NextRequest
): { uid: string; headers: Record<string, string> } {
  const cookies = parseCookie(req.headers.get('cookie'));
  const existing = cookies['uid'];

  const uid =
    existing ||
    (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

  const cookie = [
    `uid=${encodeURIComponent(uid)}`,
    'Path=/',
    'SameSite=Lax',
    'HttpOnly',
    'Secure',
    `Max-Age=${60 * 60 * 24 * 365}`,
  ].join('; ');

  return {
    uid,
    headers: { 'Set-Cookie': cookie },
  };
}
