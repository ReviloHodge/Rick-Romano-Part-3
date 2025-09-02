import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateEnv, SUPABASE_ENV_VARS } from './validateEnv';

validateEnv(SUPABASE_ENV_VARS);

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL!;
    const anon = process.env.SUPABASE_ANON_KEY!;
    _supabase = createClient(url, anon, { auth: { persistSession: false } });
  }
  return _supabase;
};

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_URL!;
    const service = process.env.SUPABASE_SERVICE_ROLE!;
    _supabaseAdmin = createClient(url, service, {
      auth: { persistSession: false },
    });
  }
  return _supabaseAdmin;
};

// Example query helper
export const upsertSnapshot = async (
  provider: string,
  leagueId: string,
  week: number,
  raw_json: any
) => {
  return getSupabaseAdmin().from('league_snapshot').upsert({
    provider,
    league_id: leagueId,
    week,
    raw_json,
  });
};
