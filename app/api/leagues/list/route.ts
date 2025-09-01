// app/api/leagues/list/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOrCreateUid } from '../../../../lib/user';
import { getSupabaseAdmin } from '../../../../lib/db';
import { decryptToken } from '../../../../lib/security';
import { listLeagues as yahooListLeagues } from '../../../../lib/providers/yahoo';

export const runtime = 'nodejs';       // <— ensure Node, not Edge
export const dynamic = 'force-dynamic';

type League = { league_id: string; name: string; season: string };

function fail(stage: string, detail?: unknown, status = 500) {
  if (detail) console.error(`[leagues:list] ${stage}`, detail);
  return NextResponse.json({ ok: false, error: `internal_error:${stage}` }, { status });
}

function ok(headers: HeadersInit, leagues: League[]) {
  return new NextResponse(JSON.stringify({ ok: true, leagues }), {
    status: 200,
    headers: { 'content-type': 'application/json', ...(headers ?? {}) },
  });
}

// Extra guard: never let uid helper crash the route
function safeUid(req: NextRequest) {
  try {
    const { uid, headers } = getOrCreateUid(req);
    if (!uid) throw new Error('no_uid');
    return { uid, headers };
  } catch (e) {
    // Fallback: synthesize a uid and set-cookie ourselves
    const synthetic = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const headers = {
      'set-cookie': `uid=${encodeURIComponent(synthetic)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
    };
    console.warn('[leagues:list] safeUid fallback used');
    return { uid: synthetic, headers };
  }
}

export async function GET(req: NextRequest) {
  console.log('[leagues:list] start');

  try {
    const provider = (req.nextUrl.searchParams.get('provider') || '').toLowerCase();
    if (!provider) return fail('missing_provider', null, 400);

    const { uid, headers } = safeUid(req);
    console.log('[leagues:list] uid resolved');

    if (provider === 'sleeper') {
      return ok(headers, [] as League[]);
    }
    if (provider !== 'yahoo') return fail('unsupported_provider', provider, 400);

    console.log('[leagues:list] provider=yahoo');

    // A) Supabase admin
    const supabase = getSupabaseAdmin?.();
    if (!supabase) return fail('supabase_admin_missing');

    // B) Load token row
    const { data, error } = await supabase
      .from('league_connection')
      .select('access_token_enc, refresh_token_enc, expires_at')
      .eq('user_id', uid)
      .eq('provider', 'yahoo')
      .maybeSingle();

    if (error) return fail('db_select', error);
    if (!data?.access_token_enc) return fail('no_tokens', { uid }, 401);

    console.log('[leagues:list] token row found');

    // C) Decrypt access token
    let accessToken: string;
    try {
      accessToken = await decryptToken(data.access_token_enc);
    } catch (e) {
      return fail('decrypt_access_token', e);
    }

    console.log('[leagues:list] token decrypted');

    // D) Yahoo leagues
    let leagues: League[] = [];
    try {
      const raw = await yahooListLeagues(accessToken);
      leagues = Array.isArray(raw) ? raw : [];
    } catch (e) {
      return fail('yahoo_listLeagues', e);
    }

    console.log('[leagues:list] leagues ok:', leagues.length);
    return ok(headers, leagues);
  } catch (e) {
    return fail('uncaught', e);
  }
}

