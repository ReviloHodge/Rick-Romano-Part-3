export interface YahooTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  [key: string]: any;
}

export async function oauthExchange(code: string): Promise<YahooTokenResponse | null> {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;
  const redirectUri = process.env.YAHOO_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Missing Yahoo OAuth env vars');
    return null;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!res.ok) {
    let err: unknown;
    try {
      err = await res.json();
    } catch {
      err = await res.text();
    }
    console.error('Yahoo token exchange failed', res.status, err);
    return null;
  }

  return res.json();
}
