import { Snapshot, Facts, Team, Player } from '../types';

const toMap = (teams: Team[]) => {
  const map: Record<string, Team> = {};
  teams.forEach((t) => (map[t.teamId] = t));
  return map;
};

export function computeFacts(snapshot: Snapshot): Facts {
  const teamMap = toMap(snapshot.teams);

  const topTeam = [...snapshot.teams].sort((a, b) => {
    if (b.pointsForWeek !== a.pointsForWeek) {
      return b.pointsForWeek - a.pointsForWeek;
    }
    return a.teamId.localeCompare(b.teamId);
  })[0];

  let upset: Facts['upset'];
  let narrowLoss: Facts['narrowLoss'];
  snapshot.matchups.forEach((m) => {
    const home = teamMap[m.home];
    const away = teamMap[m.away];
    const winner = m.homeScore >= m.awayScore ? home : away;
    const loser = winner === home ? away : home;
    const margin = Math.abs(m.homeScore - m.awayScore);

    if (!upset && winner.pointsSeason < loser.pointsSeason) {
      upset = { winner, loser, margin };
    }
    if (margin < 10 && (!narrowLoss || margin < narrowLoss.margin)) {
      narrowLoss = { winner, loser, margin };
    }
  });

  let benchBlunder: Facts['benchBlunder'];
  snapshot.teams.forEach((team) => {
    if (!team.starters || !team.bench || team.starters.length === 0 || team.bench.length === 0) return;
    const worstStarter = team.starters.reduce((min, p) =>
      p.points < min.points ? p : min
    );
    const bestBench = team.bench.reduce((max, p) =>
      p.points > max.points ? p : max
    );
    const delta = bestBench.points - worstStarter.points;
    if (delta > 0 && (!benchBlunder || delta > benchBlunder.delta)) {
      benchBlunder = { team, starter: worstStarter, bench: bestBench, delta };
    }
  });

  let waiverRoi: Facts['waiverRoi'];
  snapshot.teams.forEach((team) => {
    const waiverPoints = (team.starters || [])
      .filter((p) => p.acquisitionType === 'waiver')
      .reduce((sum, p) => sum + p.points, 0);
    if (waiverPoints > 0 && (!waiverRoi || waiverPoints > waiverRoi.points)) {
      waiverRoi = { team, points: waiverPoints };
    }
  });

  return {
    week: snapshot.week,
    leagueName: snapshot.leagueName,
    teams: snapshot.teams,
    topScorer: { team: topTeam },
    upset,
    narrowLoss,
    benchBlunder,
    waiverRoi,
    tradeImpact: undefined,
    injuries: snapshot.transactions.injuries,
    rivalries: [],
  };
}
