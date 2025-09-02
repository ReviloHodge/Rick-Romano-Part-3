import { Facts, Team } from '../types';

export function buildScript({
  facts,
  expert_headlines,
  rivalryOneLiners,
}: {
  facts: Facts;
  expert_headlines: string[];
  rivalryOneLiners?: string[];
}): string {
  const lines: string[] = [];
  const nameOf = (team: Team) => team.nickname ?? team.teamName;

  const hookParts: string[] = [];
  const firstAward = facts.weeklyAwards[0];
  if (firstAward?.teamId) {
    const team = facts.teams.find((t) => t.teamId === firstAward.teamId);
    if (team) hookParts.push(`${nameOf(team)} earned ${firstAward.label}`);
  }
  if (facts.upset) {
    hookParts.push(`${nameOf(facts.upset.winner)} upset ${nameOf(facts.upset.loser)}`);
  } else if (facts.narrowLoss) {
    hookParts.push(`${nameOf(facts.narrowLoss.loser)} fell by ${facts.narrowLoss.margin}`);
  }
  lines.push(hookParts.join(' — ') || 'Week highlights at a glance');
  lines.push(`# Week ${facts.week} Recap — ${facts.leagueName}`);
  lines.push(
    `${facts.topScorer.team.managerName}'s ${nameOf(facts.topScorer.team)} slapped ${facts.topScorer.team.pointsForWeek} on the board.`
  );

  if (facts.upset) {
    lines.push(
      `Upset special: ${nameOf(facts.upset.winner)} shocked ${nameOf(facts.upset.loser)} by ${facts.upset.margin}.`
    );
  }
  if (facts.narrowLoss) {
    lines.push(
      `Nail-biter: ${nameOf(facts.narrowLoss.loser)} lost by ${facts.narrowLoss.margin}.`
    );
  }
  if (facts.benchBlunder) {
    lines.push(
      `Bench blunder: ${facts.benchBlunder.team.managerName} sat ${facts.benchBlunder.bench.name} (${facts.benchBlunder.bench.points}).`
    );
  }
  if (facts.waiverRoi) {
    lines.push(
      `Waiver win: ${facts.waiverRoi.team.managerName} got ${facts.waiverRoi.points} from pickups.`
    );
  }
  facts.injuries.forEach((i) =>
    lines.push(`Injury watch: ${i.player} for ${i.team} is ${i.status}.`)
  );
  expert_headlines.forEach((h) => lines.push(h));
  if (facts.rivalries.length > 0 && rivalryOneLiners?.length) {
    rivalryOneLiners.forEach((r) => lines.push(r));
  }
  lines.push('This is Rick Romano—keep your pads low and your claims higher.');
  return lines.join('\n');
}
