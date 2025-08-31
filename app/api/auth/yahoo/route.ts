// app/api/auth/yahoo/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOrCreateUid } from '../../../../lib/user';
import { oauthExchange } from '../../../../lib/providers/yahoo';

/**
 * Build Yahoo OAuth authorize URL.
 * Required params: client_id, redirect_uri, response_type=code, scope, state
 * We include 'openid fspt-r' so Fantasy Sports read access works.
 */
function buildAuth(clientId: string, redirectUri: string, state: string) {
  const auth = new URL('https://api.login.yahoo.com/oauth2/request_auth');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', 'openid fspt-r');
  auth.searchParams.set('language', 'en-us');
  auth.searchParams.set('state', state);
  return auth;
}

/**
 * GET /api/auth/yahoo
 *
 * Dual-purpose:
 *  - If called WITHOUT ?code=*
