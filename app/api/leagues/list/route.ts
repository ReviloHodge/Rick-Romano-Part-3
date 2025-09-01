// app/api/leagues/list/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOrCreateUid } from '../../../../lib/user';
import { getSupabaseAdmin } from '../../../../lib/db';
import { decryptToken } from '../../../../lib/security';
import { listLeagues as yahooListLeagues } from '../../../../lib/providers/yahoo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const provider = (req.nextUrl.searchParams.get('provider') || '').toLowerCase();

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'missing_provider' },
        { status: 400 }
      );
    }

    // Identify user via uid cookie
    const { uid, headers } = getOrCreateUid(req);

    // Sleeper uses manual league entry; nothing to list here.
    if (provider === 'sleeper') {
      return new NextResponse(
        JSON.stringify({ ok: true, leagues: [] as any[] }),
        {
          status: 200,
          headers: { 'content-type': 'application/json', ...(headers ?? {}) },
        }
      );
    }

    if (provider !== 'yahoo') {
      return NextResponse.json(
        { ok: false, error: 'unsupported_provider' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('league_connection')
      .select('access_token_enc, refresh_token_enc, expires_at')
      .eq('user_id', uid)
      .eq('provider', 'yahoo')
      .maybeSingle();

    if (error) {
      console.error('supabase_error', error);
      return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
    }

    if (!data?.access_token_enc) {
      return new NextResponse(JSON.stringify({ ok: false, error: 'no_tokens' }), {
        status: 401,
        headers: { 'content-type': 'application/json', ...(headers ?? {}) },
      });
    }

    const accessToken = await decryptToken(data.access_token_enc);

    // NOTE: Depending on your yahooListLeagues() implementation,
    // this may return the raw Yahoo blob or a normalized array.
    const leagues: any = await yahooListLeagues(accessToken);

    return new NextResponse(JSON.stringify({ ok: true, leagues }), {
      status: 200,
      headers: { 'content-type': 'application/json', ...(headers ?? {}) },
    });
  } catch (err: any) {
    console.error('leagues_list_error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
