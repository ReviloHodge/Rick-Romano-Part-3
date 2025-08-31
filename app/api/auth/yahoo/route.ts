import { NextRequest, NextResponse } from 'next/server';
import { encryptToken } from '@/lib/security';
import { getSupabaseAdmin } from '@/lib/db';
import { track } from '@/lib/metrics';
import { oauthExchange, listLeagues } from '@/lib/providers/yahoo';

async function exchange(code: string, userId?: string | null) {
  const supabaseAdmin = getSupabaseAdmin();
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

  track('oauth_success', userId, { provider: 'yahoo' });
  const leagues = await listLeagues(tokens.access_token);
  return NextResponse.json({ ok: true, leagues });
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const userId = req.nextUrl.searchParams.get('userId');
  if (!code) {
    const auth = new URL('https://api.login.yahoo.com/oauth2/request_auth');
    auth.searchParams.set('client_id', process.env.YAHOO_CLIENT_ID || '');
    auth.searchParams.set('redirect_uri', process.env.YAHOO_REDIRECT_URI || '');
    auth.searchParams.set('response_type', 'code');
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
