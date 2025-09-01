import { setTimeout as sleep } from 'node:timers/promises';

export class FetchError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

export async function safeFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const maxAttempts = 3;
  let attempt = 0;
  const requestId = (init.headers as any)?.['x-request-id'] || crypto.randomUUID();
  const headers = { ...(init.headers || {}), 'x-request-id': requestId } as Record<string, string>;
  while (attempt < maxAttempts) {
    const res = await fetch(url, { ...init, headers });
    if (res.status === 429 || res.status >= 500) {
      attempt++;
      const delay = Math.pow(2, attempt) * 100 + Math.random() * 100;
      await sleep(delay);
      continue;
    }
    if (!res.ok) {
      throw new FetchError('http_error', `Request failed with ${res.status}`, res.status);
    }
    try {
      const json = (await res.json()) as T;
      return json;
    } catch (e) {
      throw new FetchError('invalid_json', 'Failed to parse JSON', res.status);
    }
  }
  throw new FetchError('max_retries', 'Exceeded retry attempts', 500);
}
