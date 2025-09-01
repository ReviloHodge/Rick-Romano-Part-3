// app/api/leagues/list/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOrCreateUid } from '../../../../lib/user';
import { getSupabaseAdmin } from '../../../../lib/db';
import { decryptToken } from '../../../../lib/security';
import { listLeagues as yahooListLeagues, League } from '../../../../lib/providers/yahoo';

export const dynamic = 'force-dynamic';

function err(stage: string, detail?: unknown, status = 500) {
  // Never leak low-level messages to the client; include stage for triage.
  if (detail) console.error(`[leagues_list] ${stage}`, detail);
  return NextResponse.json({ ok: false, error: `internal_error:${stage}` }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const provider = (req.nextUrl.searchParams.get('provider') || '').toLowerCase();
    if (!provider) return err('missing_provider', null, 400);

    const { uid, headers } = getOrCreateUid(req);

    if (provider === 'sleeper') {
      return new NextResponse(JSON.stringify({ ok: true, leagues: [] as League[] }), {
        status: 200,
        headers: { 'content-type': 'application/json', ...(headers ?? {}) },
      });
    }

    if (provider !== 'yahoo') return err('unsupported_provider', null, 400);

    // STAGE A: Supabase admin
    const supabase = getSupabaseAdmin?.();
    if (!supabase) return err('supabase_admin_missing');

    // STAGE B: Load connection row
    const { data, error } = await supabase
      .from('league_connection')
      .select('access_token_enc, refresh_token_enc, expires_at')
      .eq('user_id', uid)
      .eq('provider', 'yahoo')
      .maybeSingle();

    if (error) return err('db_select', error);
    if (!data?.access_token_enc) return err('no_tokens', null, 401);

    // STAGE C: Decrypt token
    let accessToken: string;
    try {
      accessToken = await decryptToken(data.access_token_enc);
    } catch (e) {
      return err('decrypt_access_token', e);
    }

    // STAGE D: Yahoo listLeagues
    let leagues: League[] = [];
    try {
      leagues = await yahooListLeagues(accessToken);
      if (!Array.isArray(leagues)) leagues = [];
    } catch (e) {
      return err('yahoo_listLeagues', e);
    }

    // STAGE E: Success
    return new NextResponse(JSON.stringify({ ok: true, leagues }), {
      status: 200,
      headers: { 'content-type': 'application/json', ...(headers ?? {}) },
    });
  } catch (e) {
    return err('uncaught', e);
  }
}

