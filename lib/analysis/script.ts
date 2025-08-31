import { Facts } from '../types';

export function buildScript({
  facts,
  expert_headlines,
}: {
  facts: Facts;
  expert_headlines: string[];
}): string {
  const lines: string[] = [];
  lines.push(`# Week ${facts.week} Recap — ${facts.league_name}`);
  lines.push(
    `${facts.top_scorer.team.manager_name}'s ${facts.top_scorer.team.team_name} slapped ${facts.top_scorer.team.points_for_week} on the board.`
  );

  if (facts.upset) {
    lines.push(
      `Upset special: ${facts.upset.winner.team_name} shocked ${facts.upset.loser.team_name} by ${facts.upset.margin}.`
    );
  }
  if (facts.narrow_loss) {
    lines.push(
      `Nail-biter: ${facts.narrow_loss.loser.team_name} lost by ${facts.narrow_loss.margin}.`
    );
  }
  if (facts.bench_blunder) {
    lines.push(
      `Bench blunder: ${facts.bench_blunder.team.manager_name} sat ${facts.bench_blunder.bench.name} (${facts.bench_blunder.bench.points}).`
    );
  }
  if (facts.waiver_roi) {
    lines.push(
      `Waiver win: ${facts.waiver_roi.team.manager_name} got ${facts.waiver_roi.points} from pickups.`
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
