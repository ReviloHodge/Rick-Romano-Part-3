import { describe, it, expect, vi } from 'vitest';
import { safeFetch, FetchError } from '../lib/http/safeFetch';

describe('safeFetch', () => {
  it('resolves json when successful', async () => {
    const data = { ok: true };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch' as any)
      .mockImplementation(async (_url: any, init: any) => {
        expect(init?.signal).toBeInstanceOf(AbortSignal);
        return new Response(JSON.stringify(data), { status: 200 });
      });

    const res = await safeFetch<typeof data>('https://example.com');
    expect(res).toEqual(data);
    fetchSpy.mockRestore();
  });

  it('aborts when timeout elapses', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch' as any)
      .mockImplementation((_url: any, init: any) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      });

    const promise = safeFetch('https://example.com', { timeoutMs: 1000 });
    await vi.advanceTimersByTimeAsync(1000);
    await expect(promise).rejects.toBeInstanceOf(FetchError);
    await expect(promise).rejects.toMatchObject({ code: 'timeout' });

    fetchSpy.mockRestore();
    vi.useRealTimers();
  });
});
