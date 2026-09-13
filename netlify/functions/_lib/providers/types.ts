export const matchStatuses = [
  'SCHEDULED',
  'TIMED',
  'IN_PLAY',
  'PAUSED',
  'FINISHED',
  'POSTPONED',
  'SUSPENDED',
  'CANCELLED',
] as const;
export type MatchStatus = (typeof matchStatuses)[number];
export interface TeamRef {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string | null;
}
export interface Score {
  home: number | null;
  away: number | null;
}
export interface Match {
  id: number;
  utcDate: string;
  status: MatchStatus;
  minute: number | null;
  period: 'FIRST_HALF' | 'SECOND_HALF' | 'EXTRA_TIME' | 'PENALTIES' | null;
  stage: string;
  matchday: number | null;
  venue: string | null;
  referee: string | null;
  home: TeamRef;
  away: TeamRef;
  score: Score;
  halfTime: Score;
  fullTime: Score;
  updatedAt: string;
}
export interface StandingRow {
  position: number;
  team: TeamRef;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
export interface ScorerRow {
  id: number;
  name: string;
  team: TeamRef;
  goals: number;
  assists: number | null;
  played: number | null;
}
export interface MatchesFilter {
  dateFrom?: string;
  dateTo?: string;
  season?: number;
}
export interface Provider {
  matches(filter: MatchesFilter): Promise<Match[]>;
  match(id: number): Promise<Match>;
  standings(): Promise<StandingRow[]>;
  scorers(limit: number): Promise<ScorerRow[]>;
}
export interface Payload<T> {
  data: T;
  updatedAt: string;
  stale: boolean;
  retryAfter?: number;
}
export interface DemoSnapshot {
  mode: 'historical-reconstruction' | 'live-capture';
  season: string;
  replayAt: string;
  capturedAt: string;
  provenance: string;
  sources: string[];
  standingsNote: string;
  scorersNote: string;
  matches: Match[];
  standings: StandingRow[];
  scorers: ScorerRow[];
}
