import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const uid = req.cookies.get('uid')?.value;
  if (!uid) {
    const res = NextResponse.next();
    res.cookies.set('uid', crypto.randomUUID(), { httpOnly: true, sameSite: 'lax', path: '/' });
    return res;
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|favicon.ico).*)'] };
