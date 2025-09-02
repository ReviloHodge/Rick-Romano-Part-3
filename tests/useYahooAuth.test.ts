// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useYahooAuth } from '../app/hooks/useYahooAuth';

describe('useYahooAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('returns stable UID and redirect URL', () => {
    const start = useYahooAuth();
    const first = start();
    expect(first.url).toBe(`/api/auth/yahoo?userId=${encodeURIComponent(first.uid)}`);
    expect(localStorage.getItem('uid')).toBe(first.uid);
    expect(window.location.href).toBe(first.url);

    const second = start();
    expect(second.uid).toBe(first.uid);
    expect(second.url).toBe(first.url);
    expect(window.location.href).toBe(second.url);
  });
});
