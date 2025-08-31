import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export function getOrCreateUid(req: NextRequest): { uid: string; headers?: HeadersInit } {
  const uid = req.cookies.get('uid')?.value;
  if (uid) {
    return { uid };
  }
  const newUid = crypto.randomUUID();
  const headers: HeadersInit = {
    'Set-Cookie': `uid=${newUid}; HttpOnly; Path=/; SameSite=Lax`,
  };
  return { uid: newUid, headers };
}
