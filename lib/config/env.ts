import { z } from 'zod';

const EnvSchema = z.object({
  // Yahoo
  YAHOO_CLIENT_ID: z.string().min(1, 'YAHOO_CLIENT_ID is required').optional(),
  YAHOO_CLIENT_SECRET: z.string().min(1, 'YAHOO_CLIENT_SECRET is required').optional(),
  YAHOO_REDIRECT_URI: z.string().url('YAHOO_REDIRECT_URI must be a URL').optional(),
  YAHOO_SCOPES: z.string().default('openid profile email fspt-r'),
  YAHOO_TOKEN_STORE: z.string().default('./.tokens/yahoo.json'),

  // Sleeper
  SLEEPER_BASE_URL: z.string().url().default('https://api.sleeper.app/v1'),
  SLEEPER_LEAGUE_ID: z.string().optional(),

  // App
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cached: AppEnv | null = null;

export function getEnv(requireYahoo: boolean = false): AppEnv {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    type Issue = { path: Array<string | number>; message: string };
    const issues = (parsed.error.issues as Issue[])
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  const env = parsed.data;
  if (requireYahoo) {
    const missing: string[] = [];
    if (!env.YAHOO_CLIENT_ID) missing.push('YAHOO_CLIENT_ID');
    if (!env.YAHOO_CLIENT_SECRET) missing.push('YAHOO_CLIENT_SECRET');
    if (!env.YAHOO_REDIRECT_URI) missing.push('YAHOO_REDIRECT_URI');
    if (missing.length) {
      throw new Error(`Missing required Yahoo env vars: ${missing.join(', ')}`);
    }
  }
  cached = env;
  return env;
}

