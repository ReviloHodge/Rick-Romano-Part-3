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
    const service = process.env.SUPABASE_SERVICE_ROLE;
    console.log('[db] creating Supabase admin client', {
      SUPABASE_URL: url ? 'present' : 'missing',
      SUPABASE_SERVICE_ROLE: service ? 'present' : 'missing',
    });
    if (!url || !service) {
      throw new Error('Missing Supabase service env vars');
    }
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
