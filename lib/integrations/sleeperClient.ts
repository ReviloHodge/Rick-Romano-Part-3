import { safeFetch } from '../http/safeFetch';
import { getEnv } from '../config/env';

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string | number;
}

export interface SleeperUser {
  user_id: string;
  username: string;
  display_name?: string;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
}

export interface SleeperMatchup {
  matchup_id: number;
  roster_id: number;
  starters: string[];
  players: string[];
  players_points: Record<string, number>;
  points: number;
}

const TIMEOUT_MS = 10_000;

function baseUrl() {
  return getEnv().SLEEPER_BASE_URL.replace(/\/$/, '');
}

function assertNonEmpty(name: string, value: string | number | undefined | null) {
  if (value == null || value === '') throw new Error(`${name} is required`);
}

export async function getLeague(leagueId: string): Promise<SleeperLeague> {
  assertNonEmpty('leagueId', leagueId);
  const url = `${baseUrl()}/league/${encodeURIComponent(leagueId)}`;
  return safeFetch<SleeperLeague>(url, { timeoutMs: TIMEOUT_MS });
}

export async function getUsers(leagueId: string): Promise<SleeperUser[]> {
  assertNonEmpty('leagueId', leagueId);
  const url = `${baseUrl()}/league/${encodeURIComponent(leagueId)}/users`;
  return safeFetch<SleeperUser[]>(url, { timeoutMs: TIMEOUT_MS });
}

export async function getRosters(leagueId: string): Promise<SleeperRoster[]> {
  assertNonEmpty('leagueId', leagueId);
  const url = `${baseUrl()}/league/${encodeURIComponent(leagueId)}/rosters`;
  return safeFetch<SleeperRoster[]>(url, { timeoutMs: TIMEOUT_MS });
}

export async function getMatchups(leagueId: string, week: number): Promise<SleeperMatchup[]> {
  assertNonEmpty('leagueId', leagueId);
  if (!Number.isFinite(week) || week <= 0) throw new Error('week must be a positive number');
  const url = `${baseUrl()}/league/${encodeURIComponent(leagueId)}/matchups/${week}`;
  return safeFetch<SleeperMatchup[]>(url, { timeoutMs: TIMEOUT_MS });
}

