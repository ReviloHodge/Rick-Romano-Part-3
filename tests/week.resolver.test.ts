import { describe, it, expect } from 'vitest';
import { resolveLastCompletedWeek } from '../lib/providers/sleeper';

describe('resolveLastCompletedWeek', () => {
  it('handles preseason', () => {
    expect(resolveLastCompletedWeek(2023, new Date('2023-08-20'))).toBe(0);
  });

  it('returns last completed week on Tuesday', () => {
    expect(resolveLastCompletedWeek(2023, new Date('2023-09-19T12:00:00Z'))).toBe(1);
  });

  it('clamps to week 18 after season', () => {
    expect(resolveLastCompletedWeek(2023, new Date('2024-02-10'))).toBe(18);
  });
});
