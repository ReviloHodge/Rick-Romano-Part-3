import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateEnv, SUPABASE_ENV_VARS } from './validateEnv';

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!_supabase) {
    validateEnv(SUPABASE_ENV_VARS);
    // validateEnv guarantees presence; use type assertion (avoids non-null '!')
    const url = process.env.SUPABASE_URL as string;
    const anon = process.env.SUPABASE_ANON_KEY as string;

    _supabase = createClient(url, anon, { auth: { persistSession: false } });
  }
  return _supabase;
};

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!_supabaseAdmin) {
    validateEnv(SUPABASE_ENV_VARS);
    // validateEnv guarantees presence; still add lightweight diagnostics
    const url = process.env.SUPABASE_URL as string;
    const service = process.env.SUPABASE_SERVICE_ROLE as string;

    // eslint-disable-next-line no-console
    console.log('[db] SUPABASE_URL', url ? 'present' : 'missing');
    // eslint-disable-next-line no-console
    console.log('[db] SUPABASE_SERVICE_ROLE', service ? 'present' : 'missing');

    // In case SUPABASE_ENV_VARS ever drifts, keep a defensive check
    if (!url || !service) {
      const missing = [
        !url && 'SUPABASE_URL',
        !service && 'SUPABASE_SERVICE_ROLE',
      ]
        .filter(Boolean)
        .join(', ');
      throw new Error(`Missing Supabase service env vars: ${missing}`);
    }

    _supabaseAdmin = createClient(url, service, { auth: { persistSession: false } });

    if (typeof (_supabaseAdmin as any).from !== 'function') {
      throw new Error('Supabase admin client failed to initialize');
    }
  }
  return _supabaseAdmin;
};

// Example query helper
export const upsertSnapshot = async (
  provider: string,
  leagueId: string,
  week: number,
  raw_json: unknown
) => {
  const { data, error } = await getSupabaseAdmin()
    .from('league_snapshot')
    .upsert({ provider, league_id: leagueId, week, raw_json });

  if (error) throw error;
  return data;
};
