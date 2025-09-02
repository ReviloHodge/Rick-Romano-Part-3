export function validateEnv(keys: readonly string[]): void {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

export const YAHOO_ENV_VARS = [
  'YAHOO_CLIENT_ID',
  'YAHOO_CLIENT_SECRET',
  'YAHOO_REDIRECT_URI',
] as const;

export const SUPABASE_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE',
] as const;
