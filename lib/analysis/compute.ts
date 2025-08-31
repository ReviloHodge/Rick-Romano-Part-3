import { Snapshot, Facts, Team, Player } from '../types';

const toMap = (teams: Team[]) => {
  const map: Record<string, Team> = {};
  teams.forEach((t) => (map[t.team_id] = t));
  return map;
};

export function computeFacts(snapshot: Snapshot): Facts {
  const teamMap = toMap(snapshot.teams);

  const topTeam = [...snapshot.teams].sort((a, b) => {
    if (b.points_for_week !== a.points_for_week) {
      return b.points_for_week - a.points_for_week;
    }
    return a.team_id.localeCompare(b.team_id);
  })[0];

  let upset: Facts['upset'];
  let narrow_loss: Facts['narrow_loss'];
  snapshot.matchups.forEach((m) => {
    const home = teamMap[m.home];
    const away = teamMap[m.away];
    const winner = m.home_score >= m.away_score ? home : away;
    const loser = winner === home ? away : home;
    const margin = Math.abs(m.home_score - m.away_score);

    if (!upset && winner.points_season < loser.points_season) {
      upset = { winner, loser, margin };
    }
    if (margin < 10 && (!narrow_loss || margin < narrow_loss.margin)) {
      narrow_loss = { winner, loser, margin };
    }
  });

  let bench_blunder: Facts['bench_blunder'];
  snapshot.teams.forEach((team) => {
    if (!team.starters || !team.bench || team.starters.length === 0 || team.bench.length === 0) return;
    const worstStarter = team.starters.reduce((min, p) =>
      p.points < min.points ? p : min
    );
    const bestBench = team.bench.reduce((max, p) =>
      p.points > max.points ? p : max
    );
    const delta = bestBench.points - worstStarter.points;
    if (delta > 0 && (!bench_blunder || delta > bench_blunder.delta)) {
      bench_blunder = { team, starter: worstStarter, bench: bestBench, delta };
    }
  });

  let waiver_roi: Facts['waiver_roi'];
  snapshot.teams.forEach((team) => {
    const waiverPoints = (team.starters || [])
      .filter((p) => p.acquisitionType === 'waiver')
      .reduce((sum, p) => sum + p.points, 0);
    if (waiverPoints > 0 && (!waiver_roi || waiverPoints > waiver_roi.points)) {
      waiver_roi = { team, points: waiverPoints };
    }
  });

  return {
    week: snapshot.week,
    league_name: snapshot.league_name,
    teams: snapshot.teams,
    top_scorer: { team: topTeam },
    upset,
    narrow_loss,
    bench_blunder,
    waiver_roi,
    trade_impact: undefined,
    injuries: snapshot.transactions.injuries,
    rivalries: [],
  };
}
