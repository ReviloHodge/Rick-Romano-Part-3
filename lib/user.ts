import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * Retrieve a persistent anonymous UID from cookies, creating one if missing.
 * Returns the uid and optional headers to set the cookie.
 */
export function getOrCreateUid(
  req: NextRequest
): { uid: string; headers?: Record<string, string> } {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|; )uid=([^;]+)/);
  if (match) {
    return { uid: decodeURIComponent(match[1]) };
  }
  const uid = randomUUID();
  return {
    uid,
    headers: {
      'set-cookie': `uid=${encodeURIComponent(
        uid
      )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
    },
  };
}
