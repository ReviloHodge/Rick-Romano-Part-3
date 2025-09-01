import { NextResponse } from 'next/server';
import { ZMatchupWeek } from '../../../../lib/schemas';
import type { EpisodeDraft } from '../../../../types/domain';

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ZMatchupWeek.parse(body);
  const draft: EpisodeDraft = {
    leagueId: parsed.league.leagueId,
    week: parsed.week,
    outline: ['intro', 'highlights', 'wrap'],
    scriptMarkdown: `# Week ${parsed.week} Recap`,
  };
  return NextResponse.json(draft);
}
