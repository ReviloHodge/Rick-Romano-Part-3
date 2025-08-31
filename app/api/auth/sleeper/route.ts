// app/api/auth/sleeper/route.ts
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/sleeper
 * Sleeper league data is public; we don't need OAuth.
 * Just send the user to the dashboard flow for entering a League URL/ID.
 */
export async function GET(req: Request) {
  return NextResponse.redirect(new URL('/dashboard?provider=sleeper', req.url));
}

/**
 * POST /api/auth/sleeper
 * Optional helper for programmatic callers; indicates no OAuth flow.
 */
export async function POST(_req: Request) {
  return NextResponse.json({
    ok: true,
    provider: 'sleeper',
    stub: true,
    auth: null,
    note: 'Sleeper uses public endpoints; collect League URL/ID on the dashboard.',
  });
}
