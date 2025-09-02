/// <reference types="vitest" />
import { useSleeperAuth } from '../app/hooks/useSleeperAuth';

describe('useSleeperAuth', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      clear: () => {
        for (const k in store) delete store[k];
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };
    (globalThis as any).window = { location: { href: '' } };
  });

  it('returns stable UID and redirect URL', () => {
    const start = useSleeperAuth();
    const first = start();
    expect(first.url).toBe('/dashboard?provider=sleeper');
    expect(localStorage.getItem('uid')).toBe(first.uid);
    expect(window.location.href).toBe(first.url);

    const second = start();
    expect(second.uid).toBe(first.uid);
    expect(second.url).toBe(first.url);
    expect(window.location.href).toBe(second.url);
  });
});
