export type Provider = 'sleeper' | 'yahoo';

export interface League {
  leagueId: string;
  name: string;
  season: string | number;
}

export interface Player {
  id: string;
  name: string;
  points: number;
  acquisitionType?: 'waiver' | 'free_agent' | 'draft' | 'trade';
}

export interface Team {
  teamId: string;
  managerName: string;
  teamName: string;
  nickname?: string;
  pointsForWeek: number;
  pointsSeason: number;
  starters?: Player[];
  bench?: Player[];
}

export interface Matchup {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
}

export interface Injury {
  player: string;
  team: string;
  status: string;
}

export interface Snapshot {
  week: number;
  leagueName: string;
  teams: Team[];
  matchups: Matchup[];
  transactions: {
    waivers: { teamId: string; player: Player; started: boolean }[];
    trades: any[]; // TODO refine
    injuries: Injury[];
  };
}

export interface Facts {
  week: number;
  leagueName: string;
  teams: Team[];
  weeklyAwards: Array<{
    key: string;
    label: string;
    teamId?: string;
    value?: number;
    meta?: Record<string, unknown>;
  }>;
  topScorer: { team: Team };
  upset?: { winner: Team; loser: Team; margin: number };
  narrowLoss?: { winner: Team; loser: Team; margin: number };
  benchBlunder?: { team: Team; starter: Player; bench: Player; delta: number };
  waiverRoi?: { team: Team; points: number };
  tradeImpact?: any; // TODO refine
  injuries: Injury[];
  rivalries: { teamA: string; teamB: string; historySummary: string }[];
}
