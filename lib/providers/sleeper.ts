export async function getLeaguesForUsername(username: string, season: number) {
  const user = await (await fetch(`https://api.sleeper.app/v1/user/${username}`)).json();
  return await (
    await fetch(
      `https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${season}`
    )
  ).json();
}

export async function listLeagues(username: string, season: number) {
  return getLeaguesForUsername(username, season);
}

export async function getLeagueWeekData(leagueId: string, week: number) {
  const url = `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`;
  return await (await fetch(url)).json();
}
