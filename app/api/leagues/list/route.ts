// app/api/leagues/list/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOrCreateUid } from '../../../../lib/user';
import { getSupabaseAdmin } from '../../../../lib/db';
import { decryptToken, encryptToken } from '../../../../lib/security';
import {
  listLeagues as yahooListLeagues,
  refreshToken as yahooRefresh,
} from '../../../../lib/providers/yahoo';
import { FetchError } from '../../../../lib/http/safeFetch';

export const runtime = 'nodejs';       // <— ensure Node, not Edge
export const dynamic = 'force-dynamic';

type League = { leagueId: string; name: string; season: string };

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
      'Set-Cookie': `uid=${encodeURIComponent(synthetic)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
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
    let supabase: ReturnType<typeof getSupabaseAdmin>;
    try {
      supabase = getSupabaseAdmin();
    } catch (err) {
      return fail('supabase_admin_init', err);
    }
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

    // C) Decrypt tokens
    let accessToken: string;
    let refreshToken: string | null = null;
    try {
      accessToken = await decryptToken(data.access_token_enc);
      refreshToken = data.refresh_token_enc
        ? await decryptToken(data.refresh_token_enc)
        : null;
    } catch (e) {
      return fail('decrypt_access_token', e);
    }

    console.log('[leagues:list] token decrypted');

    // Refresh if expired
    const expired = data.expires_at
      ? new Date(data.expires_at).getTime() <= Date.now()
      : false;
    if (expired && refreshToken) {
      try {
        const fresh = await yahooRefresh(refreshToken);
        accessToken = fresh.access_token;
        if (fresh.refresh_token) refreshToken = fresh.refresh_token;

        const updates: Record<string, any> = {
          access_token_enc: await encryptToken(accessToken),
          expires_at: fresh.expires_in
            ? new Date(Date.now() + fresh.expires_in * 1000).toISOString()
            : null,
        };
        if (fresh.refresh_token) {
          updates.refresh_token_enc = await encryptToken(fresh.refresh_token);
        }
        const { error: upErr } = await supabase
          .from('league_connection')
          .update(updates)
          .eq('user_id', uid)
          .eq('provider', 'yahoo');
        if (upErr) return fail('db_update_tokens', upErr);
      } catch (e) {
        return fail('token_refresh', e, 401);
      }
    }

    // D) Yahoo leagues
    let leagues: League[] = [];
    try {
      const raw = await yahooListLeagues(accessToken);
      leagues = Array.isArray(raw) ? raw : [];
    } catch (e) {
      if (e instanceof FetchError && e.status === 401 && refreshToken) {
        try {
          const fresh = await yahooRefresh(refreshToken);
          accessToken = fresh.access_token;
          if (fresh.refresh_token) refreshToken = fresh.refresh_token;

          const updates: Record<string, any> = {
            access_token_enc: await encryptToken(accessToken),
            expires_at: fresh.expires_in
              ? new Date(Date.now() + fresh.expires_in * 1000).toISOString()
              : null,
          };
          if (fresh.refresh_token) {
            updates.refresh_token_enc = await encryptToken(fresh.refresh_token);
          }
          const { error: upErr } = await supabase
            .from('league_connection')
            .update(updates)
            .eq('user_id', uid)
            .eq('provider', 'yahoo');
          if (upErr) return fail('db_update_tokens', upErr);

          const retry = await yahooListLeagues(accessToken);
          leagues = Array.isArray(retry) ? retry : [];
        } catch (e2) {
          return fail('yahoo_listLeagues_refresh', e2);
        }
      } else {
        return fail('yahoo_listLeagues', e);
      }
    }

    console.log('[leagues:list] leagues ok:', leagues.length);
    return ok(headers, leagues);
  } catch (e) {
    return fail('uncaught', e);
  }
}

