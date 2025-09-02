import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScript } from '../script';
import { Facts } from '../../types';

test('buildScript uses hook, nicknames, headlines and rivalries', () => {
  const facts: Facts = {
    week: 2,
    leagueName: 'Test League',
    teams: [
      {
        teamId: '1',
        managerName: 'Alice',
        teamName: 'Aces',
        nickname: 'Aceholes',
        pointsForWeek: 120,
        pointsSeason: 300,
      },
      {
        teamId: '2',
        managerName: 'Bob',
        teamName: 'Blitz',
        nickname: 'Blitzy',
        pointsForWeek: 100,
        pointsSeason: 280,
      },
    ],
    weeklyAwards: [{ key: 'top', label: 'Top Scorer', teamId: '1' }],
    topScorer: { team: {
      teamId: '1',
      managerName: 'Alice',
      teamName: 'Aces',
      nickname: 'Aceholes',
      pointsForWeek: 120,
      pointsSeason: 300,
    } },
    upset: { winner: {
      teamId: '1',
      managerName: 'Alice',
      teamName: 'Aces',
      nickname: 'Aceholes',
      pointsForWeek: 120,
      pointsSeason: 300,
    }, loser: {
      teamId: '2',
      managerName: 'Bob',
      teamName: 'Blitz',
      nickname: 'Blitzy',
      pointsForWeek: 100,
      pointsSeason: 280,
    }, margin: 20 },
    narrowLoss: undefined,
    benchBlunder: undefined,
    waiverRoi: undefined,
    tradeImpact: undefined,
    injuries: [],
    rivalries: [ { teamA: 'Aceholes', teamB: 'Blitzy', historySummary: 'bad blood' } ],
  };

  const script = buildScript({
    facts,
    expert_headlines: ['Expert: Aceholes are title favorites.'],
    rivalryOneLiners: ['Rivalry still red hot.'],
  });

  const lines = script.split('\n');
  assert.ok(lines[0].includes('Aceholes'));
  assert.ok(lines[0].includes('upset'));
  assert.ok(script.includes('Aceholes') && script.includes('Blitzy'));
  assert.ok(script.includes('Expert: Aceholes are title favorites.'));
  assert.ok(script.includes('Rivalry still red hot.'));
  assert.ok(script.includes('keep your pads low'));
});
