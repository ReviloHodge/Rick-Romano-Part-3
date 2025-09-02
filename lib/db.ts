import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_ANON_KEY;
    if (!url || !anon) {
      throw new Error('Missing Supabase client env vars');
    }
    _supabase = createClient(url, anon, { auth: { persistSession: false } });
  }
  return _supabase;
};

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    if (!url) {
      throw new Error('Missing SUPABASE_URL environment variable');
    }
    const service = process.env.SUPABASE_SERVICE_ROLE;
    if (!service) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE environment variable');
    }
    _supabaseAdmin = createClient(url, service, {
      auth: { persistSession: false },
    });
    if (typeof _supabaseAdmin.from !== 'function') {
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
  raw_json: any
) => {
  return getSupabaseAdmin().from('league_snapshot').upsert({
    provider,
    league_id: leagueId,
    week,
    raw_json,
  });
};
