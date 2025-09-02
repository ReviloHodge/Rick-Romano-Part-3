import { Snapshot } from './types';

// Adapt legacy snake_case snapshots to the new camelCase structure.
export function adaptSnapshot(data: any): Snapshot {
  if (!data || typeof data !== 'object') {
    throw new Error('invalid snapshot');
  }
  // If data already uses camelCase, assume it's correct.
  if ('leagueName' in data) {
    return data as Snapshot;
  }
  return {
    week: data.week,
    leagueName: data.league_name,
    teams: (data.teams || []).map((t: any) => ({
      teamId: t.team_id,
      managerName: t.manager_name,
      teamName: t.team_name,
      pointsForWeek: t.points_for_week,
      pointsSeason: t.points_season,
      starters: t.starters,
      bench: t.bench,
    })),
    matchups: (data.matchups || []).map((m: any) => ({
      home: m.home,
      away: m.away,
      homeScore: m.home_score,
      awayScore: m.away_score,
    })),
    transactions: {
      waivers: (data.transactions?.waivers || []).map((w: any) => ({
        teamId: w.team_id,
        player: w.player,
        started: w.started,
      })),
      trades: data.transactions?.trades || [],
      injuries: data.transactions?.injuries || [],
    },
  };
}
