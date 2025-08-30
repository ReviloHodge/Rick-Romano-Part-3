import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL as string;
const anon = process.env.SUPABASE_ANON_KEY as string;
const service = process.env.SUPABASE_SERVICE_ROLE as string;

export const supabase: SupabaseClient = createClient(url, anon, {
  auth: { persistSession: false },
});

export const supabaseAdmin: SupabaseClient = createClient(url, service, {
  auth: { persistSession: false },
});

// Example query helper
export const upsertSnapshot = async (
  provider: string,
  leagueId: string,
  week: number,
  raw_json: any
) => {
  return supabaseAdmin.from('league_snapshot').upsert({
    provider,
    league_id: leagueId,
    week,
    raw_json,
  });
};
