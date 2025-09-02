import test from 'node:test';
import assert from 'node:assert/strict';
import { toSnapshot } from '../yahoo';
import { computeFacts } from '../../analysis/compute';

const rawScoreboard = {
  fantasy_content: {
    league: [
      { name: 'Test League', season: '2024' },
      {
        scoreboard: {
          matchups: [
            {
              matchup: {
                teams: [
                  {
                    team: {
                      team_id: '1',
                      name: 'Aces',
                      managers: [{ manager: { nickname: 'Alice', guid: '1' } }],
                      team_points: { total: '120' },
                      roster: {
                        players: [
                          { player: { player_id: 's1', name: { full: 'StarterA' }, selected_position: 'QB', total_points: '20' } },
                          { player: { player_id: 'w1', name: { full: 'WaiverStar' }, selected_position: 'RB', total_points: '25', acquisition_type: 'waiver' } },
                          { player: { player_id: 's2', name: { full: 'StarterB' }, selected_position: 'WR', total_points: '10' } },
                          { player: { player_id: 'b1', name: { full: 'BenchGuy' }, selected_position: 'BN', total_points: '15' } },
                        ],
                      },
                    },
                  },
                  {
                    team: {
                      team_id: '2',
                      name: 'Blitz',
                      managers: [{ manager: { nickname: 'Bob', guid: '2' } }],
                      team_points: { total: '110' },
                      roster: {
                        players: [
                          { player: { player_id: 'sb1', name: { full: 'SlowStart' }, selected_position: 'QB', total_points: '5' } },
                          { player: { player_id: 'sb2', name: { full: 'OKStart' }, selected_position: 'WR', total_points: '15' } },
                          { player: { player_id: 'bb1', name: { full: 'BenchBoom' }, selected_position: 'BN', total_points: '25' } },
                        ],
                      },
                    },
                  },
                ],
              },
            },
            {
              matchup: {
                teams: [
                  {
                    team: {
                      team_id: '3',
                      name: 'Crushers',
                      managers: [{ manager: { nickname: 'Carl', guid: '3' } }],
                      team_points: { total: '90' },
                      roster: {
                        players: [
                          { player: { player_id: 'c1', name: { full: 'C1' }, selected_position: 'QB', total_points: '40' } },
                          { player: { player_id: 'cb1', name: { full: 'CB1' }, selected_position: 'BN', total_points: '5' } },
                        ],
                      },
                    },
                  },
                  {
                    team: {
                      team_id: '4',
                      name: 'Dynamos',
                      managers: [{ manager: { nickname: 'Dana', guid: '4' } }],
                      team_points: { total: '91' },
                      roster: {
                        players: [
                          { player: { player_id: 'd1', name: { full: 'D1' }, selected_position: 'QB', total_points: '42' } },
                          { player: { player_id: 'db1', name: { full: 'DB1' }, selected_position: 'BN', total_points: '10' } },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  },
};

test('computeFacts works on Yahoo sample', () => {
  const snapshot = toSnapshot({ leagueId: 'L1', name: 'Test League', season: '2024' }, 1, rawScoreboard);
  const facts = computeFacts(snapshot);
  assert.equal(facts.topScorer.team.teamId, '1');
  assert.equal(facts.benchBlunder?.team.teamId, '2');
  assert.equal(facts.waiverRoi?.team.teamId, '1');
});
