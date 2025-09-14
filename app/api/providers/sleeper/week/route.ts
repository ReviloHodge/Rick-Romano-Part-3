import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getLeagueWeek, resolveLastCompletedWeek } from '../../../../../lib/providers/sleeper';

const Body = z.object({ leagueId: z.string(), week: z.number().optional() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leagueId, week } = Body.parse(body);
    const targetWeek = week ?? resolveLastCompletedWeek(new Date().getFullYear());
    const { domain } = await getLeagueWeek(leagueId, targetWeek);
    return NextResponse.json(domain);
  } catch (e: any) {
    const msg = e?.message || 'invalid_request';
    const status = e?.name === 'ZodError' ? 400 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
