import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db';
import { computeFacts } from '@/lib/analysis/compute';
import { buildScript } from '@/lib/analysis/script';
import { track } from '@/lib/metrics';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { provider, leagueId, week, userId } = await req.json();
    if (!provider || !leagueId || !week) {
      return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('episode')
      .select('id')
      .eq('provider', provider)
      .eq('league_id', leagueId)
      .eq('week', week)
      .single();
    if (existing) {
      return NextResponse.json({ ok: true, episodeId: existing.id });
    }

    const { data: snap, error: snapErr } = await supabaseAdmin
      .from('league_snapshot')
      .select('raw_json')
      .eq('provider', provider)
      .eq('league_id', leagueId)
      .eq('week', week)
      .single();
    if (snapErr || !snap) {
      return NextResponse.json({ ok: false, error: 'snapshot_missing' }, { status: 400 });
    }
    const facts = computeFacts(snap.raw_json);
    const script = buildScript({ facts, expert_headlines: [] });
    const { data: ep, error: epErr } = await supabaseAdmin
      .from('episode')
      .insert({
        user_id: userId,
        provider,
        league_id: leagueId,
        week,
        script_md: script,
      })
      .select('id')
      .single();
    if (epErr || !ep) {
      return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
    }
    track('episode_generated', userId, { episode_id: ep.id });
    return NextResponse.json({ ok: true, episodeId: ep.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
