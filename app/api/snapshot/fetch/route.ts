import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/security';
import { getSupabaseAdmin, upsertSnapshot } from '@/lib/db';
import { track } from '@/lib/metrics';
import { getLeagueWeek as sleeperData } from '@/lib/providers/sleeper';
import { getLeagueWeekData as yahooData } from '@/lib/providers/yahoo';
import { Provider } from '@/lib/types';

const lastCompletedWeek = (): number => {
  // naive: assume NFL season and weeks start Tuesday
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return week - 1;
};

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { provider, leagueId, week, userId } = await req.json();
    if (!provider || !leagueId) {
      return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
    }
    const fetchWeek = week || lastCompletedWeek();
    const { data, error } = await supabaseAdmin
      .from('league_connection')
      .select('access_token_enc')
      .eq('provider', provider)
      .eq('league_id', leagueId)
      .single();
    if (error || !data) {
      return NextResponse.json({ ok: false, error: 'no_token' }, { status: 400 });
    }
    const access = await decryptToken(data.access_token_enc);
    const snapshot =
      provider === 'sleeper'
        ? await sleeperData(leagueId, fetchWeek)
        : await yahooData(access, leagueId, fetchWeek);
    await upsertSnapshot(provider, leagueId, fetchWeek, snapshot);
    track('snapshot_saved', userId, {
      provider,
      league_id: leagueId,
      week: fetchWeek,
    });
    return NextResponse.json({ ok: true, week: fetchWeek });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
