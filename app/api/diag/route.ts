import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return NextResponse.json({
    hasMakeUrl: !!(process.env.MAKE_CONNECTOR_URL || process.env.NEXT_PUBLIC_MAKE_CONNECTOR_URL),
    hasYahooClientId: !!process.env.YAHOO_CLIENT_ID,
    hasYahooRedirectUri: !!process.env.YAHOO_REDIRECT_URI,
    origin,
  });
}
