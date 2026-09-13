import { ChevronRight } from 'lucide-react';
import type { Match } from '../types';
import { isLive } from '../lib/time';
import { kickoff, scoreText } from '../lib/format';
import { useMatchClock } from '../hooks/useMatchClock';
import { Crest } from './Crest';
export function MatchRow({
  match,
  onSelect,
  receivedAt = 0,
}: {
  match: Match;
  onSelect: (m: Match) => void;
  receivedAt?: number;
}) {
  const clock = useMatchClock(match, receivedAt);
  const scheduled = ['SCHEDULED', 'TIMED'].includes(match.status);
  return (
    <button
      className={`match-row ${isLive(match) ? 'row-live' : ''}`}
      onClick={() => onSelect(match)}
      aria-label={`${match.home.name} versus ${match.away.name}, ${scheduled ? kickoff(match.utcDate) : scoreText(match.score)}, ${clock}. Match details`}
    >
      <span className={`match-time ${isLive(match) ? 'live-time' : ''}`}>
        {isLive(match) && <span className="row-live-label">LIVE </span>}
        {scheduled ? kickoff(match.utcDate) : clock}
      </span>
      <span className="row-team home-team">
        <span>{match.home.shortName}</span>
        <Crest team={match.home} />
      </span>
      <span className="row-score">
        {scheduled ? '—' : scoreText(match.score)}
      </span>
      <span className="row-team away-team">
        <Crest team={match.away} />
        <span>{match.away.shortName}</span>
      </span>
      <ChevronRight className="row-chevron" size={16} />
    </button>
  );
}
