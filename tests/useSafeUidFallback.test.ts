/// <reference types="vitest" />
import { NextRequest } from 'next/server';

vi.mock('../lib/user', () => {
  return {
    getOrCreateUid: () => {
      throw new Error('boom');
    },
  };
});

vi.mock('../lib/db', () => {
  return {
    getSupabaseAdmin: () => {
      throw new Error('should not call');
    },
  };
});

vi.mock('../lib/providers/yahoo', () => ({
  listLeagues: async () => [],
  refreshToken: async () => ({ access_token: '', refresh_token: '', expires_in: 0 }),
}));

describe('safeUid fallback', () => {
  it('sets uid cookie when getOrCreateUid throws', async () => {
    const { GET } = await import('../app/api/leagues/list/route');
    const req = new NextRequest('http://example.com/api/leagues/list?provider=sleeper');
    const res = await GET(req as any);
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toBeTruthy();
    expect(cookie).toContain('uid=');
  });
});
