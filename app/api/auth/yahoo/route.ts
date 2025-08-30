import { NextRequest, NextResponse } from 'next/server';
import { encryptToken } from '@/lib/security';
import { supabaseAdmin } from '@/lib/db';
import { track } from '@/lib/metrics';
import { oauthExchange, listLeagues } from '@/lib/providers/yahoo';

export async function POST(req: NextRequest) {
  try {
    const { code, userId } = await req.json();
    if (!code) {
      return NextResponse.json({ ok: false, error: 'missing code' }, { status: 400 });
    }
    const tokens = await oauthExchange(code);
    const access_enc = await encryptToken(tokens.access_token);
    const refresh_enc = tokens.refresh_token
      ? await encryptToken(tokens.refresh_token)
      : null;

    if (userId) {
      await supabaseAdmin.from('league_connection').upsert({
        user_id: userId,
        provider: 'yahoo',
        access_token_enc: access_enc,
        refresh_token_enc: refresh_enc,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      });
    }

    const leagues = await listLeagues(tokens.access_token);
    track('oauth_success', userId, { provider: 'yahoo' });
    return NextResponse.json({ ok: true, leagues });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
