import { z } from "zod";

export const ZSleeperUser = z.object({
  user_id: z.string(),
  username: z.string(),
  display_name: z.string().optional(),
});

export const ZSleeperLeague = z.object({
  league_id: z.string(),
  name: z.string(),
  season: z.coerce.number(),
});

export const ZSleeperMatchup = z.object({
  matchup_id: z.number(),
  roster_id: z.number(),
  points: z.number().default(0),
  starters: z.array(z.string()).default([]),
  players: z.array(z.string()).default([]),
  players_points: z.record(z.number()).default({}),
});

export const ZSleeperRoster = z.object({
  roster_id: z.number(),
  owner_id: z.string(),
});

export const ZSleeperUserMap = z.object({
  user_id: z.string(),
  username: z.string(),
  display_name: z.string().optional(),
});

export const ZRosterSpot = z.object({
  slot: z.string(),
  playerId: z.string(),
  points: z.number(),
});

export const ZMatchup = z.object({
  id: z.string(),
  week: z.number(),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  homePoints: z.number(),
  awayPoints: z.number(),
  homeRoster: z.array(ZRosterSpot),
  awayRoster: z.array(ZRosterSpot),
  winner: z.enum(["home", "away", "tie"]),
  margin: z.number(),
});

export const ZMatchupWeek = z
  .object({
    platform: z.literal("sleeper"),
    league: z.object({
      platform: z.literal("sleeper"),
      leagueId: z.string(),
      season: z.number(),
      name: z.string(),
    }),
    generatedAt: z.string(),
    week: z.number(),
    teams: z.array(
      z.object({
        teamId: z.string(),
        displayName: z.string(),
        ownerUserId: z.string(),
      })
    ),
    matchups: z.array(ZMatchup),
    summary: z.object({
      topScorerTeamId: z.string(),
      topScorerPoints: z.number(),
      biggestBlowoutGameId: z.string().nullable(),
      closestGameId: z.string().nullable(),
    }),
    weeklyAwards: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        teamId: z.string().optional(),
        value: z.number().optional(),
        meta: z.record(z.unknown()).optional(),
      })
    ),
  })
  .strict();

export const ZYahooMatchupWeek = z
  .object({
    platform: z.literal("yahoo"),
    league: z.object({
      platform: z.literal("yahoo"),
      leagueId: z.string(),
      season: z.number(),
      name: z.string(),
    }),
    generatedAt: z.string(),
    week: z.number(),
    teams: z.array(
      z.object({
        teamId: z.string(),
        displayName: z.string(),
        ownerUserId: z.string(),
      }),
    ),
    matchups: z.array(ZMatchup),
    summary: z.object({
      topScorerTeamId: z.string(),
      topScorerPoints: z.number(),
      biggestBlowoutGameId: z.string().nullable(),
      closestGameId: z.string().nullable(),
    }),
    weeklyAwards: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        teamId: z.string().optional(),
        value: z.number().optional(),
        meta: z.record(z.unknown()).optional(),
      }),
    ),
  })
  .strict();

export type SleeperUser = z.infer<typeof ZSleeperUser>;
export type SleeperLeague = z.infer<typeof ZSleeperLeague>;
export type SleeperMatchup = z.infer<typeof ZSleeperMatchup>;
export type SleeperRoster = z.infer<typeof ZSleeperRoster>;
export type SleeperUserMap = z.infer<typeof ZSleeperUserMap>;
export type MatchupWeekSchema = z.infer<typeof ZMatchupWeek>;
export type YahooMatchupWeekSchema = z.infer<typeof ZYahooMatchupWeek>;
