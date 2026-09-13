import { ScoreValue } from './ScoreValue';
import { Clock3, Radio } from 'lucide-react';
import type { Match } from '../types';
import { countdown, isLive, matchClock } from '../lib/time';
import { kickoff, dateLabel, scoreText } from '../lib/format';
import { useNow } from '../hooks/useMatchClock';
import { LiveIndicator } from './LiveIndicator';
import { Crest } from './Crest';
export function LiveStrip({
  matches,
  onSelect,
  receivedAt,
  replayAt,
  loading = false,
  unavailable = false,
}: {
  matches: Match[];
  onSelect: (m: Match) => void;
  receivedAt: number;
  replayAt?: string;
  loading?: boolean;
  unavailable?: boolean;
}) {
  const now = useNow();
  const reference = replayAt ? Date.parse(replayAt) : now;
  const live = matches.filter(isLive);
  const next = matches
    .filter(
      (m) =>
        ['SCHEDULED', 'TIMED'].includes(m.status) &&
        Date.parse(m.utcDate) > reference,
    )
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0];
  if (!live.length)
    return (
      <section className="next-strip" aria-label="Next match">
        <span className="next-icon">
          <Clock3 size={28} />
        </span>
        <div>
          <p>
            {loading
              ? 'Finding the next match'
              : unavailable
                ? 'The match feed is offline'
                : next
                  ? 'Next kickoff'
                  : 'Between matchdays'}
          </p>
          <h2>
            {next
              ? `${next.home.shortName} vs ${next.away.shortName}`
              : unavailable
                ? 'Football will be right here.'
                : 'The next chapter awaits.'}
          </h2>
          <span>
            {next
              ? `${dateLabel(next.utcDate)}, ${kickoff(next.utcDate)} local time`
              : unavailable
                ? 'Explore a real matchday in the historical demo below.'
                : 'Fixtures will appear when the competition publishes them.'}
          </span>
        </div>
        {next && (
          <strong className="next-countdown">
            {countdown(next.utcDate, reference)}
          </strong>
        )}
      </section>
    );
  return (
    <section
      className="live-section"
      aria-label={replayAt ? 'Historical matchday replay' : 'Live matches'}
    >
      <div className="live-strip-heading">
        <div>
          <LiveIndicator count={live.length} replay={!!replayAt} />
          <span>
            {live.length} matches{' '}
            {live.every((m) => m.status === 'PAUSED')
              ? 'at half-time'
              : 'in progress'}
          </span>
        </div>
        <span className="live-caption">
          <Radio size={14} />
          {replayAt ? dateLabel(replayAt) : 'Matchday feed'}
        </span>
      </div>
      <div className="live-cards">
        {live.map((m) => (
          <button
            className="live-card"
            key={m.id}
            onClick={() => onSelect(m)}
            aria-label={`${m.home.name} versus ${m.away.name}, ${scoreText(m.score)}. Open match details`}
          >
            <div className="live-card-meta">
              <span>
                {m.matchday ? `Matchday ${m.matchday}` : 'Champions League'}
              </span>
              <span>
                {matchClock(m, reference, replayAt ? reference : receivedAt)}
              </span>
            </div>
            <div className="live-match-line">
              <div className="live-team">
                <Crest team={m.home} />
                <span>{m.home.shortName}</span>
              </div>
              <strong className="live-score">
                <ScoreValue score={m.score} />
              </strong>
              <div className="live-team">
                <Crest team={m.away} />
                <span>{m.away.shortName}</span>
              </div>
            </div>
            <div className="live-card-foot">
              {m.venue ?? 'Match details'}
              <span>View match</span>
            </div>
          </button>
        ))}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {live
          .map(
            (m) =>
              `${m.home.name} ${m.score.home}, ${m.away.name} ${m.score.away}.`,
          )
          .join(' ')}
      </div>
    </section>
  );
}
