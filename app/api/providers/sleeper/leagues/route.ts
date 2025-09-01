import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdByUsername, getLeaguesForUser } from '../../../../../lib/providers/sleeper';

const Body = z.object({ username: z.string(), season: z.number().optional() });

export async function POST(req: Request) {
  const body = await req.json();
  const { username, season } = Body.parse(body);
  const userId = await getUserIdByUsername(username);
  const leagues = await getLeaguesForUser(userId, season ?? new Date().getFullYear());
  return NextResponse.json(leagues);
}
