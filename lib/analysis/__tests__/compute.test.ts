import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFacts } from '../compute';
import { Snapshot } from '../../types';

const snapshot: Snapshot = {
  week: 1,
  leagueName: 'Test League',
  teams: [
    {
      teamId: '1',
      managerName: 'Alice',
      teamName: 'Aces',
      pointsForWeek: 120,
      pointsSeason: 300,
      starters: [
        { id: 's1', name: 'StarterA', points: 20 },
        { id: 'w1', name: 'WaiverStar', points: 25, acquisitionType: 'waiver' },
        { id: 's2', name: 'StarterB', points: 10 },
      ],
      bench: [{ id: 'b1', name: 'BenchGuy', points: 30 }],
    },
    {
      teamId: '2',
      managerName: 'Bob',
      teamName: 'Blitz',
      pointsForWeek: 110,
      pointsSeason: 330,
      starters: [
        { id: 'sb1', name: 'SlowStart', points: 5 },
        { id: 'sb2', name: 'OKStart', points: 15 },
      ],
      bench: [{ id: 'bb1', name: 'BenchBoom', points: 25 }],
    },
    {
      teamId: '3',
      managerName: 'Carl',
      teamName: 'Crushers',
      pointsForWeek: 90,
      pointsSeason: 310,
      starters: [{ id: 'c1', name: 'C1', points: 40 }],
      bench: [{ id: 'cb1', name: 'CB1', points: 5 }],
    },
    {
      teamId: '4',
      managerName: 'Dana',
      teamName: 'Dynamos',
      pointsForWeek: 91,
      pointsSeason: 305,
      starters: [{ id: 'd1', name: 'D1', points: 42 }],
      bench: [{ id: 'db1', name: 'DB1', points: 10 }],
    },
  ],
  matchups: [
    { home: '1', away: '2', homeScore: 120, awayScore: 110 },
    { home: '3', away: '4', homeScore: 90, awayScore: 91 },
  ],
  transactions: {
    waivers: [
      {
        teamId: '1',
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
  assert.equal(facts.upset?.winner.teamId, '1');
  assert.equal(facts.narrowLoss?.loser.teamId, '3');
  assert.equal(facts.benchBlunder?.team.teamId, '2');
  assert.equal(facts.waiverRoi?.team.teamId, '1');
});
