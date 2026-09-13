import { z } from 'zod';
import type { Provider, TeamRef, Match, StandingRow, ScorerRow } from './types';
import { normaliseStatus, safeCrest, scoreSchema } from './normalise';
import type { Transport } from './http';
const teamSchema = z.object({
  id: z.number().nullable(),
  name: z.string().nullable(),
  shortName: z.string().nullish(),
  tla: z.string().nullish(),
  crest: z.string().nullish(),
});
function team(raw: z.infer<typeof teamSchema>): TeamRef {
  const name = raw.name ?? 'To be confirmed';
  return {
    id: raw.id ?? 0,
    name,
    shortName: raw.shortName ?? name,
    tla: raw.tla ?? name.slice(0, 3).toUpperCase(),
    crest: safeCrest(raw.crest),
  };
}
const matchSchema = z.object({
  id: z.number(),
  utcDate: z.string(),
  status: z.string(),
  minute: z.number().nullish(),
  stage: z.string(),
  matchday: z.number().nullish(),
  venue: z.string().nullish(),
  attendance: z.number().int().nonnegative().nullish(),
  lastUpdated: z.string(),
  competition: z.object({ code: z.string() }),
  season: z.object({ startDate: z.string() }).optional(),
  homeTeam: teamSchema,
  awayTeam: teamSchema,
  score: z.object({
    duration: z.string().optional(),
    fullTime: scoreSchema,
    halfTime: scoreSchema.optional(),
  }),
  referees: z
    .array(z.object({ name: z.string(), type: z.string().optional() }))
    .optional(),
});
export function normaliseFootballDataMatch(input: unknown): Match {
  const m = matchSchema.parse(input);
  if (m.competition.code !== 'CL') throw new Error('Competition mismatch');
  const status = normaliseStatus(m.status);
  const current = {
    home: m.score.fullTime.home ?? null,
    away: m.score.fullTime.away ?? null,
  };
  return {
    id: m.id,
    utcDate: m.utcDate,
    seasonStart: m.season ? Number(m.season.startDate.slice(0, 4)) : undefined,
    status,
    minute: m.minute ?? null,
    period:
      m.score.duration === 'PENALTY_SHOOTOUT'
        ? 'PENALTIES'
        : m.score.duration === 'EXTRA_TIME'
          ? 'EXTRA_TIME'
          : m.minute != null
            ? m.minute > 45
              ? 'SECOND_HALF'
              : 'FIRST_HALF'
            : null,
    stage: m.stage,
    matchday: m.matchday ?? null,
    venue: m.venue ?? null,
    attendance: m.attendance ?? null,
    referee:
      m.referees?.find((r) => r.type === 'REFEREE')?.name ??
      m.referees?.[0]?.name ??
      null,
    home: team(m.homeTeam),
    away: team(m.awayTeam),
    score: current,
    halfTime: {
      home: m.score.halfTime?.home ?? null,
      away: m.score.halfTime?.away ?? null,
    },
    fullTime: status === 'FINISHED' ? current : { home: null, away: null },
    updatedAt: m.lastUpdated,
  };
}
const standingSchema = z.object({
  position: z.number(),
  team: teamSchema,
  playedGames: z.number(),
  won: z.number(),
  draw: z.number(),
  lost: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  goalDifference: z.number(),
  points: z.number(),
});
export function footballData(transport: Transport): Provider {
  return {
    async matches(filter) {
      const raw = z
        .object({ matches: z.array(z.unknown()) })
        .parse(await transport('competitions/CL/matches', { ...filter }));
      return raw.matches.map(normaliseFootballDataMatch);
    },
    async match(id) {
      return normaliseFootballDataMatch(await transport(`matches/${id}`));
    },
    async standings(): Promise<StandingRow[]> {
      const raw = z
        .object({
          standings: z.array(
            z.object({
              stage: z.string(),
              type: z.string(),
              table: z.array(standingSchema),
            }),
          ),
        })
        .parse(await transport('competitions/CL/standings'));
      const table = raw.standings.find(
        (s) =>
          s.type === 'TOTAL' &&
          ['LEAGUE_STAGE', 'LEAGUE_PHASE', 'REGULAR_SEASON'].includes(s.stage),
      );
      return (table?.table ?? []).map((r) => ({
        position: r.position,
        team: team(r.team),
        played: r.playedGames,
        won: r.won,
        drawn: r.draw,
        lost: r.lost,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        goalDifference: r.goalDifference,
        points: r.points,
      }));
    },
    async scorers(limit): Promise<ScorerRow[]> {
      const raw = z
        .object({
          scorers: z.array(
            z.object({
              player: z.object({ id: z.number(), name: z.string() }),
              team: teamSchema,
              goals: z.number(),
              assists: z.number().nullish(),
              playedMatches: z.number().nullish(),
            }),
          ),
        })
        .parse(await transport('competitions/CL/scorers', { limit }));
      return raw.scorers.slice(0, limit).map((r) => ({
        id: r.player.id,
        name: r.player.name,
        team: team(r.team),
        goals: r.goals,
        assists: r.assists ?? null,
        played: r.playedMatches ?? null,
      }));
    },
  };
}
