import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getLeagueWeek, resolveLastCompletedWeek } from '../../../../../lib/providers/sleeper';

const Body = z.object({ leagueId: z.string(), week: z.number().optional() });

export async function POST(req: Request) {
  const body = await req.json();
  const { leagueId, week } = Body.parse(body);
  const targetWeek = week ?? resolveLastCompletedWeek(new Date().getFullYear());
  const { domain } = await getLeagueWeek(leagueId, targetWeek);
  return NextResponse.json(domain);
}
