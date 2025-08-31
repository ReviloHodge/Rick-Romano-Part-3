import { NextRequest, NextResponse } from 'next/server';
import { encryptToken } from '@/lib/security';
import { getSupabaseAdmin } from '@/lib/db';
import { track } from '@/lib/metrics';
import { listLeagues } from '@/lib/providers/sleeper';

async function exchange(code: string, userId?: string | null) {
  const supabaseAdmin = getSupabaseAdmin();
  const tokenRes = await fetch('https://api.sleeper.app/v1/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: process.env.SLEEPER_CLIENT_ID,
      client_secret: process.env.SLEEPER_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.SLEEPER_REDIRECT_URI,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error('token_exchange_failed');
  }
  const tokens = await tokenRes.json();
  const access_enc = await encryptToken(tokens.access_token);
  const refresh_enc = tokens.refresh_token
    ? await encryptToken(tokens.refresh_token)
    : null;

  if (userId) {
    await supabaseAdmin.from('league_connection').upsert({
      user_id: userId,
      provider: 'sleeper',
      access_token_enc: access_enc,
      refresh_token_enc: refresh_enc,
    });
  }
  track('oauth_success', userId, { provider: 'sleeper' });
  const leagues = await listLeagues(tokens.access_token);
  return NextResponse.json({ ok: true, leagues });
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const userId = req.nextUrl.searchParams.get('userId');
  if (!code) {
    const auth = new URL('https://sleeper.com/oauth2/authorize');
    auth.searchParams.set('response_type', 'code');
    auth.searchParams.set('client_id', process.env.SLEEPER_CLIENT_ID || '');
    auth.searchParams.set('redirect_uri', process.env.SLEEPER_REDIRECT_URI || '');
    if (userId) auth.searchParams.set('state', userId);
    return NextResponse.redirect(auth.toString());
  }
  try {
    return await exchange(code, userId);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code, userId } = await req.json();
    if (!code) {
      return NextResponse.json({ ok: false, error: 'missing code' }, { status: 400 });
    }
    return await exchange(code, userId);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
