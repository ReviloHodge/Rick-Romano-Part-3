import { NextRequest, NextResponse } from 'next/server';
import { encryptToken } from '@/lib/security';
import { getSupabaseAdmin } from '@/lib/db';
import { track } from '@/lib/metrics';
import { listLeagues } from '@/lib/providers/sleeper';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { code, userId } = await req.json();
    if (!code) {
      return NextResponse.json({ ok: false, error: 'missing code' }, { status: 400 });
    }

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
      return NextResponse.json({ ok: false, error: 'token_exchange_failed' }, { status: 500 });
    }
    const tokens = await tokenRes.json();
    const access_enc = await encryptToken(tokens.access_token);
    const refresh_enc = tokens.refresh_token
      ? await encryptToken(tokens.refresh_token)
      : null;

    // TODO: persist tokens for userId
    if (userId) {
      await supabaseAdmin.from('league_connection').upsert({
        user_id: userId,
        provider: 'sleeper',
        access_token_enc: access_enc,
        refresh_token_enc: refresh_enc,
      });
    }

    const leagues = await listLeagues(tokens.access_token);
    track('oauth_success', userId, { provider: 'sleeper' });
    return NextResponse.json({ ok: true, leagues });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
