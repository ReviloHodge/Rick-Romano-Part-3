import { setTimeout as sleep } from 'node:timers/promises';

/** Optional request init parameters supported by {@link safeFetch}. */
interface SafeFetchInit extends RequestInit {
  /**
   * Maximum time in milliseconds to wait for the request before aborting.
   * Defaults to 10 seconds.
   */
  timeoutMs?: number;
}

export class FetchError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

export async function safeFetch<T>(
  url: string,
  init: SafeFetchInit = {},
): Promise<T> {
  const maxAttempts = 3;
  let attempt = 0;
  const { timeoutMs = 10_000, ...requestInit } = init;
  const requestId = (requestInit.headers as any)?.['x-request-id'] || crypto.randomUUID();
  const headers = {
    ...(requestInit.headers || {}),
    'x-request-id': requestId,
  } as Record<string, string>;

  while (attempt < maxAttempts) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(url, {
        ...requestInit,
        headers,
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        throw new FetchError('timeout', 'Request timed out', 408);
      }
      throw err;
    }
    clearTimeout(timeoutId);

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
