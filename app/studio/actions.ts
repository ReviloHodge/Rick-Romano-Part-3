'use server';

import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import type { LeagueMeta, MatchupWeek } from '../../types/domain';
import { getLeagueWeek, resolveLastCompletedWeek } from '../../lib/providers/sleeper';
import { tagLeague, tagLeagueWeek } from '../../lib/cache/tags';

export async function selectLeague(meta: LeagueMeta) {
  cookies().set('selected-league', JSON.stringify(meta), {
    httpOnly: true,
    path: '/',
  });
  revalidateTag(tagLeague(meta.leagueId));
}

export async function loadLastWeek(leagueId: string): Promise<MatchupWeek> {
  const week = resolveLastCompletedWeek(new Date().getFullYear());
  const { domain } = await getLeagueWeek(leagueId, week);
  revalidateTag(tagLeagueWeek(leagueId, week));
  return domain;
}
