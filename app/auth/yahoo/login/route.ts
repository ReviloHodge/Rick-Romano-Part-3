import { NextResponse } from 'next/server';
import { buildAuthorizationUrl } from '@/lib/integrations/yahooAuth';

export const runtime = 'nodejs';

export async function GET() {
  const url = await buildAuthorizationUrl('local');
  return NextResponse.redirect(url);
}

