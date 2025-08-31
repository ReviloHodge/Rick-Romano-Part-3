export type Provider = 'sleeper' | 'yahoo';

export interface League {
  league_id: string;
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
  team_id: string;
  manager_name: string;
  team_name: string;
  points_for_week: number;
  points_season: number;
  starters?: Player[];
  bench?: Player[];
}

export interface Matchup {
  home: string;
  away: string;
  home_score: number;
  away_score: number;
}

export interface Injury {
  player: string;
  team: string;
  status: string;
}

export interface Snapshot {
  week: number;
  league_name: string;
  teams: Team[];
  matchups: Matchup[];
  transactions: {
    waivers: { team_id: string; player: Player; started: boolean }[];
    trades: any[]; // TODO refine
    injuries: Injury[];
  };
}

export interface Facts {
  week: number;
  league_name: string;
  teams: Team[];
  top_scorer: { team: Team };
  upset?: { winner: Team; loser: Team; margin: number };
  narrow_loss?: { winner: Team; loser: Team; margin: number };
  bench_blunder?: { team: Team; starter: Player; bench: Player; delta: number };
  waiver_roi?: { team: Team; points: number };
  trade_impact?: any; // TODO refine
  injuries: Injury[];
  rivalries: { teamA: string; teamB: string; history_summary: string }[];
}
