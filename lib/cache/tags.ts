export const tagLeague = (leagueId: string) => `league:${leagueId}`;
export const tagLeagueWeek = (leagueId: string, week: number) => `${tagLeague(leagueId)}:week:${week}`;
