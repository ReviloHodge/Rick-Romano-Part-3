import { NextRequest, NextResponse } from 'next/server';
import { decryptToken, encryptToken } from '@/lib/security';
import { getSupabaseAdmin, upsertSnapshot } from '@/lib/db';
import { track, flush } from '@/lib/metrics';
import { getLeagueWeek as sleeperData } from '@/lib/providers/sleeper';
import {
  getLeagueWeek as yahooData,
  toSnapshot as yahooToSnapshot,
  refreshToken as yahooRefresh,
} from '@/lib/providers/yahoo';
import { Provider } from '@/lib/types';
import { FetchError } from '@/lib/http/safeFetch';

export const runtime = 'nodejs';

const lastCompletedWeek = (): number => {
  // naive: assume NFL season and weeks start Tuesday
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return week - 1;
};

export async function POST(req: NextRequest) {
  // track env status for easier debugging without leaking secrets
  const envStatus = {
    node: process.env.NODE_ENV,
    hasUrl: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE,
  };

  let provider: Provider | undefined;
  let leagueId: string | undefined;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    provider = body.provider;
    leagueId = body.leagueId;
    const { week, userId } = body;

    if (!provider || !leagueId) {
      return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
    }
    const fetchWeek = week || lastCompletedWeek();

    let access: string | undefined;
    let refresh: string | null = null;

    if (provider === 'yahoo') {
      let data:
        | { access_token_enc: string; refresh_token_enc?: string; expires_at?: string }
        | null = null;
      try {
        const result = await supabaseAdmin
          .from('league_connection')
          .select('access_token_enc, refresh_token_enc, expires_at')
          .eq('provider', provider)
          .eq('league_id', leagueId)
          .single();
        data = result.data;
        if (result.error || !data) {
          return NextResponse.json({ ok: false, error: 'no_token' }, { status: 400 });
        }
      } catch (dbErr) {
        console.error('[snapshot:fetch] supabase lookup failed', {
          provider,
          leagueId,
          env: envStatus,
          error: dbErr,
        });
        return NextResponse.json({ ok: false, error: 'supabase_lookup_failed' }, { status: 500 });
      }

      access = await decryptToken(data.access_token_enc);
      refresh = data.refresh_token_enc
        ? await decryptToken(data.refresh_token_enc)
        : null;

      const expired = data.expires_at
        ? new Date(data.expires_at).getTime() <= Date.now()
        : false;
      if (expired && refresh) {
        try {
          const fresh = await yahooRefresh(refresh);
          access = fresh.access_token;
          if (fresh.refresh_token) refresh = fresh.refresh_token;
          const updates: Record<string, any> = {
            access_token_enc: await encryptToken(access),
            expires_at: fresh.expires_in
              ? new Date(Date.now() + fresh.expires_in * 1000).toISOString()
              : null,
          };
          if (fresh.refresh_token) {
            updates.refresh_token_enc = await encryptToken(fresh.refresh_token);
          }
          await supabaseAdmin
            .from('league_connection')
            .update(updates)
            .eq('provider', 'yahoo')
            .eq('league_id', leagueId);
        } catch (e) {
          console.error('[snapshot:fetch] token refresh failed', {
            provider,
            leagueId,
            env: envStatus,
            error: e,
          });
          return NextResponse.json(
            { ok: false, error: 'token_refresh_failed' },
            { status: 401 },
          );
        }
      }
    }

    let snapshot: any;
    try {
      snapshot =
        provider === 'sleeper'
          ? await sleeperData(leagueId, fetchWeek)
          : await yahooData(access!, leagueId, fetchWeek);
    } catch (snapErr) {
      if (
        provider === 'yahoo' &&
        snapErr instanceof FetchError &&
        snapErr.status === 401 &&
        refresh
      ) {
        try {
          const fresh = await yahooRefresh(refresh);
          access = fresh.access_token;
          if (fresh.refresh_token) refresh = fresh.refresh_token;
          const updates: Record<string, any> = {
            access_token_enc: await encryptToken(access),
            expires_at: fresh.expires_in
              ? new Date(Date.now() + fresh.expires_in * 1000).toISOString()
              : null,
          };
          if (fresh.refresh_token) {
            updates.refresh_token_enc = await encryptToken(fresh.refresh_token);
          }
          await supabaseAdmin
            .from('league_connection')
            .update(updates)
            .eq('provider', 'yahoo')
            .eq('league_id', leagueId);
          snapshot = await yahooData(access, leagueId, fetchWeek);
        } catch (e) {
          console.error('[snapshot:fetch] provider fetch failed', {
            provider,
            leagueId,
            env: envStatus,
            error: e,
          });
          return NextResponse.json(
            { ok: false, error: 'snapshot_fetch_failed' },
            { status: 500 },
          );
        }
      } else {
        console.error('[snapshot:fetch] provider fetch failed', {
          provider,
          leagueId,
          env: envStatus,
          error: snapErr,
        });
        return NextResponse.json(
          { ok: false, error: 'snapshot_fetch_failed' },
          { status: 500 },
        );
      }
    }

    const toStore =
      provider === 'yahoo'
        ? yahooToSnapshot(
            {
              leagueId,
              name: snapshot.domain.league.name,
              season: snapshot.domain.league.season,
            },
            fetchWeek,
            snapshot.raw,
          )
        : snapshot;

    try {
      await upsertSnapshot(provider, leagueId, fetchWeek, toStore);
    } catch (saveErr) {
      console.error('[snapshot:fetch] snapshot save failed', {
        provider,
        leagueId,
        env: envStatus,
        error: saveErr,
      });
      return NextResponse.json({ ok: false, error: 'snapshot_save_failed' }, { status: 500 });
    }

    track('snapshot_saved', userId, {
      provider,
      leagueId: leagueId,
      week: fetchWeek,
    });
    await flush();
    return NextResponse.json({ ok: true, week: fetchWeek });
  } catch (err: any) {
    console.error('[snapshot:fetch] unexpected error', {
      provider,
      leagueId,
      env: envStatus,
      error: err,
    });
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
