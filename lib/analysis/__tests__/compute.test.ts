import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFacts } from '../compute';
import { Snapshot } from '../../types';

const snapshot: Snapshot = {
  week: 1,
  league_name: 'Test League',
  teams: [
    {
      team_id: '1',
      manager_name: 'Alice',
      team_name: 'Aces',
      points_for_week: 120,
      points_season: 300,
      starters: [
        { id: 's1', name: 'StarterA', points: 20 },
        { id: 'w1', name: 'WaiverStar', points: 25, acquisitionType: 'waiver' },
        { id: 's2', name: 'StarterB', points: 10 },
      ],
      bench: [{ id: 'b1', name: 'BenchGuy', points: 30 }],
    },
    {
      team_id: '2',
      manager_name: 'Bob',
      team_name: 'Blitz',
      points_for_week: 110,
      points_season: 330,
      starters: [
        { id: 'sb1', name: 'SlowStart', points: 5 },
        { id: 'sb2', name: 'OKStart', points: 15 },
      ],
      bench: [{ id: 'bb1', name: 'BenchBoom', points: 25 }],
    },
    {
      team_id: '3',
      manager_name: 'Carl',
      team_name: 'Crushers',
      points_for_week: 90,
      points_season: 310,
      starters: [{ id: 'c1', name: 'C1', points: 40 }],
      bench: [{ id: 'cb1', name: 'CB1', points: 5 }],
    },
    {
      team_id: '4',
      manager_name: 'Dana',
      team_name: 'Dynamos',
      points_for_week: 91,
      points_season: 305,
      starters: [{ id: 'd1', name: 'D1', points: 42 }],
      bench: [{ id: 'db1', name: 'DB1', points: 10 }],
    },
  ],
  matchups: [
    { home: '1', away: '2', home_score: 120, away_score: 110 },
    { home: '3', away: '4', home_score: 90, away_score: 91 },
  ],
  transactions: {
    waivers: [
      {
        team_id: '1',
        player: { id: 'w1', name: 'WaiverStar', points: 25, acquisitionType: 'waiver' },
        started: true,
      },
    ],
    trades: [],
    injuries: [{ player: 'Star RB', team: 'Blitz', status: 'out' }],
  },
};

test('computeFacts basics', () => {
  const facts = computeFacts(snapshot);
  assert.equal(facts.upset?.winner.team_id, '1');
  assert.equal(facts.narrow_loss?.loser.team_id, '3');
  assert.equal(facts.bench_blunder?.team.team_id, '2');
  assert.equal(facts.waiver_roi?.team.team_id, '1');
});
