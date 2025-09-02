/// <reference types="vitest" />

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({})
  })
}));

import { getSupabaseAdmin } from '../db';

describe('getSupabaseAdmin', () => {
  it('returns client with from method', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE = 'service-role-key';
    const client = getSupabaseAdmin();
    expect(typeof client.from).toBe('function');
  });
});
