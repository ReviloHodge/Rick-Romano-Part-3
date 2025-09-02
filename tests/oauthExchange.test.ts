/// <reference types="vitest" />
import { oauthExchange } from '../lib/providers/yahoo';

// Ensure oauthExchange surfaces Yahoo error details to callers
it('oauthExchange surfaces error detail', async () => {
  process.env.YAHOO_CLIENT_ID = 'id';
  process.env.YAHOO_CLIENT_SECRET = 'secret';
  process.env.YAHOO_REDIRECT_URI = 'http://localhost';

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 400,
    async json() {
      return { error: 'bad auth' };
    },
    async text() {
      return JSON.stringify({ error: 'bad auth' });
    },
  }) as any;

  await expect(oauthExchange('code')).rejects.toThrow(
    'yahoo_oauth_exchange_failed: {"error":"bad auth"}',
  );

  global.fetch = originalFetch;
});
