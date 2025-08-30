import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/security';
import { getSupabaseAdmin } from '@/lib/db';
import { listLeagues as sleeperList } from '@/lib/providers/sleeper';
import { listLeagues as yahooList } from '@/lib/providers/yahoo';
import { Provider } from '@/lib/types';
import { track } from '@/lib/metrics';

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') as Provider;
  const userId = req.nextUrl.searchParams.get('userId') || undefined;
  if (!provider || !userId) {
    return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('league_connection')
    .select('access_token_enc')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();
  if (error || !data) {
    return NextResponse.json({ ok: false, error: 'not_connected' }, { status: 400 });
  }
  const access = await decryptToken(data.access_token_enc);
  const leagues =
    provider === 'sleeper'
      ? await sleeperList(access)
      : await yahooList(access);
  track('league_selected', userId, { provider });
  return NextResponse.json({ ok: true, leagues });
}
