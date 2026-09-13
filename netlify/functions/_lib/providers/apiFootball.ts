import { seasonStart } from '../season';
import { z } from 'zod';
import type {
  Provider,
  TeamRef,
  Match,
  MatchStatus,
  StandingRow,
  ScorerRow,
} from './types';
import { safeCrest } from './normalise';
import { UpstreamError, type Transport } from './http';
const teamSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string().nullish(),
});
const team = (r: z.infer<typeof teamSchema>): TeamRef => ({
  id: r.id,
  name: r.name,
  shortName: r.name,
  tla: r.name.slice(0, 3).toUpperCase(),
  crest: safeCrest(r.logo),
});
const pair = z.object({
  home: z.number().nullable(),
  away: z.number().nullable(),
});
const fixture = z.object({
  fixture: z.object({
    id: z.number(),
    date: z.string(),
    referee: z.string().nullable(),
    venue: z.object({ name: z.string().nullable() }),
    status: z.object({ short: z.string(), elapsed: z.number().nullable() }),
  }),
  league: z.object({ id: z.number(), round: z.string() }),
  teams: z.object({ home: teamSchema, away: teamSchema }),
  goals: pair,
  score: z.object({ halftime: pair, fulltime: pair }),
});
const statuses: Record<string, MatchStatus> = {
  TBD: 'SCHEDULED',
  NS: 'TIMED',
  '1H': 'IN_PLAY',
  HT: 'PAUSED',
  '2H': 'IN_PLAY',
  ET: 'IN_PLAY',
  BT: 'PAUSED',
  P: 'IN_PLAY',
  LIVE: 'IN_PLAY',
  FT: 'FINISHED',
  AET: 'FINISHED',
  PEN: 'FINISHED',
  PST: 'POSTPONED',
  SUSP: 'SUSPENDED',
  INT: 'SUSPENDED',
  CANC: 'CANCELLED',
  ABD: 'CANCELLED',
  AWD: 'FINISHED',
  WO: 'FINISHED',
};
export function normaliseApiFootballMatch(input: unknown): Match {
  const r = fixture.parse(input);
  if (r.league.id !== 2) throw new Error('Competition mismatch');
  const s = r.fixture.status.short;
  if (!statuses[s]) throw new Error('Unsupported match status');
  return {
    id: r.fixture.id,
    utcDate: r.fixture.date,
    status: statuses[s],
    minute: r.fixture.status.elapsed,
    period:
      s === '1H'
        ? 'FIRST_HALF'
        : s === '2H'
          ? 'SECOND_HALF'
          : s === 'ET' || s === 'BT'
            ? 'EXTRA_TIME'
            : s === 'P'
              ? 'PENALTIES'
              : null,
    stage: r.league.round.replace(/ - \d+$/, ''),
    matchday: Number(r.league.round.match(/ - (\d+)$/)?.[1]) || null,
    venue: r.fixture.venue.name,
    referee: r.fixture.referee,
    home: team(r.teams.home),
    away: team(r.teams.away),
    score: r.goals,
    halfTime: r.score.halftime,
    fullTime:
      statuses[s] === 'FINISHED'
        ? r.score.fulltime
        : { home: null, away: null },
    updatedAt: new Date().toISOString(),
  };
}
export function apiFootball(transport: Transport): Provider {
  const read = async (
    path: string,
    params: Record<string, string | number>,
  ) => {
    const r = z
      .object({
        response: z.array(z.unknown()),
        errors: z
          .union([z.array(z.unknown()), z.record(z.string(), z.unknown())])
          .optional(),
      })
      .parse(await transport(path, params));
    if (r.errors && Object.keys(r.errors).length) throw new UpstreamError(403);
    return r.response;
  };
  return {
    async matches(filter) {
      return (
        await read('fixtures', {
          league: 2,
          season: filter.season ?? seasonStart(),
          ...(filter.dateFrom ? { from: filter.dateFrom } : {}),
          ...(filter.dateTo ? { to: filter.dateTo } : {}),
        })
      ).map(normaliseApiFootballMatch);
    },
    async match(id) {
      return normaliseApiFootballMatch((await read('fixtures', { id }))[0]);
    },
    async standings(): Promise<StandingRow[]> {
      const raw = z
        .array(
          z.object({
            league: z.object({
              standings: z.array(
                z.array(
                  z.object({
                    rank: z.number(),
                    team: teamSchema,
                    points: z.number(),
                    goalsDiff: z.number(),
                    group: z.string().optional(),
                    all: z.object({
                      played: z.number(),
                      win: z.number(),
                      draw: z.number(),
                      lose: z.number(),
                      goals: z.object({ for: z.number(), against: z.number() }),
                    }),
                  }),
                ),
              ),
            }),
          }),
        )
        .parse(await read('standings', { league: 2, season: seasonStart() }));
      return (raw[0]?.league.standings.flat() ?? []).map((r) => ({
        position: r.rank,
        team: team(r.team),
        played: r.all.played,
        won: r.all.win,
        drawn: r.all.draw,
        lost: r.all.lose,
        goalsFor: r.all.goals.for,
        goalsAgainst: r.all.goals.against,
        goalDifference: r.goalsDiff,
        points: r.points,
      }));
    },
    async scorers(limit): Promise<ScorerRow[]> {
      const raw = z
        .array(
          z.object({
            player: z.object({ id: z.number(), name: z.string() }),
            statistics: z.array(
              z.object({
                team: teamSchema,
                games: z.object({ appearences: z.number().nullable() }),
                goals: z.object({
                  total: z.number().nullable(),
                  assists: z.number().nullable(),
                }),
              }),
            ),
          }),
        )
        .parse(
          await read('players/topscorers', {
            league: 2,
            season: seasonStart(),
          }),
        );
      return raw.slice(0, limit).flatMap((r) => {
        const s = r.statistics[0];
        return s
          ? [
              {
                id: r.player.id,
                name: r.player.name,
                team: team(s.team),
                goals: s.goals.total ?? 0,
                assists: s.goals.assists,
                played: s.games.appearences,
              },
            ]
          : [];
      });
    },
  };
}
