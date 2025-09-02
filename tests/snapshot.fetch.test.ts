/// <reference types="vitest" />

const single = vi.fn().mockResolvedValue({ data: { access_token_enc: 'enc' }, error: null });
const eq2 = vi.fn().mockReturnValue({ single });
const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
const select = vi.fn().mockReturnValue({ eq: eq1 });
const from = vi.fn().mockReturnValue({ select });

vi.mock('@/lib/db', () => ({
  getSupabaseAdmin: () => ({ from }),
  upsertSnapshot: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/security', () => ({
  decryptToken: vi.fn().mockResolvedValue('token'),
}));

vi.mock('@/lib/providers/sleeper', () => ({
  getLeagueWeek: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/providers/yahoo', () => ({
  getLeagueWeek: vi.fn(),
  toSnapshot: vi.fn(),
}));

vi.mock('@/lib/metrics', () => ({
  track: vi.fn(),
  flush: vi.fn(),
}));

import { POST } from '../app/api/snapshot/fetch/route';

describe('POST /api/snapshot/fetch', () => {
  it('returns provided week on success', async () => {
    const req = {
      json: async () => ({ provider: 'sleeper', leagueId: '1', week: 7, userId: 'u' }),
    } as any;
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, week: 7 });
  });
});
