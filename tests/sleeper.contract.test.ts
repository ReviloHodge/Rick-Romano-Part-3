import { describe, it, expect } from 'vitest';
import { toDomain } from '../lib/providers/sleeper';
import { ZMatchupWeek } from '../lib/schemas';
import type { LeagueMeta } from '../types/domain';

describe('Sleeper contract', () => {
  it('normalizes matchup week', () => {
    const league: LeagueMeta = {
      platform: 'sleeper',
      leagueId: '1',
      season: 2023,
      name: 'Test League',
    };
    const matchups = [
      {
        matchup_id: 1,
        roster_id: 1,
        points: 100,
        starters: ['p1'],
        players: ['p1', 'p2'],
        players_points: { p1: 100, p2: 0 },
      },
      {
        matchup_id: 1,
        roster_id: 2,
        points: 90,
        starters: ['p3'],
        players: ['p3', 'p4'],
        players_points: { p3: 90, p4: 0 },
      },
    ];
    const rosters = [
      { roster_id: 1, owner_id: 'u1' },
      { roster_id: 2, owner_id: 'u2' },
    ];
    const users = [
      { user_id: 'u1', username: 'alice', display_name: 'Alice' },
      { user_id: 'u2', username: 'bob', display_name: 'Bob' },
    ];

    const domain = toDomain(league, 1, { matchups, rosters, users });
    const parsed = ZMatchupWeek.parse(domain);
    expect(parsed.matchups).toHaveLength(1);
    expect(parsed.summary.topScorerTeamId).toBe('1');
  });
});
