export type LeagueMeta = {
  platform: "sleeper" | "yahoo";
  leagueId: string;
  season: number;
  name: string;
};

export type UserHandle = {
  platform: "sleeper" | "yahoo";
  username: string;
};

export type Team = {
  teamId: string;
  displayName: string;
  ownerUserId: string;
};

export type RosterSpot = {
  slot: string;
  playerId: string;
  points: number;
};

export type Matchup = {
  id: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homePoints: number;
  awayPoints: number;
  homeRoster: RosterSpot[];
  awayRoster: RosterSpot[];
  winner: "home" | "away" | "tie";
  margin: number;
};

export type MatchupWeek = {
  platform: "sleeper" | "yahoo";
  league: LeagueMeta;
  generatedAt: string;
  week: number;
  teams: Team[];
  matchups: Matchup[];
  summary: {
    topScorerTeamId: string;
    topScorerPoints: number;
    biggestBlowoutGameId: string | null;
    closestGameId: string | null;
  };
  weeklyAwards: Array<{
    key: string;
    label: string;
    teamId?: string;
    value?: number;
    meta?: Record<string, unknown>;
  }>;
};

export type EpisodeDraft = {
  leagueId: string;
  week: number;
  outline: string[];
  scriptMarkdown: string;
};
