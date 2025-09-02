import { Facts } from '../types';

export function buildScript({
  facts,
  expert_headlines,
}: {
  facts: Facts;
  expert_headlines: string[];
}): string {
  const lines: string[] = [];
  lines.push(`# Week ${facts.week} Recap — ${facts.leagueName}`);
  lines.push(
    `${facts.topScorer.team.managerName}'s ${facts.topScorer.team.teamName} slapped ${facts.topScorer.team.pointsForWeek} on the board.`
  );

  if (facts.upset) {
    lines.push(
      `Upset special: ${facts.upset.winner.teamName} shocked ${facts.upset.loser.teamName} by ${facts.upset.margin}.`
    );
  }
  if (facts.narrowLoss) {
    lines.push(
      `Nail-biter: ${facts.narrowLoss.loser.teamName} lost by ${facts.narrowLoss.margin}.`
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
  lines.push(
    'This is Rick Romano—keep your pads low and your claims higher.'
  );
  return lines.join('\n');
}
