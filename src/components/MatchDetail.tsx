import { MatchAnalysis } from './MatchAnalysis';
import { useEffect, useRef } from 'react';
import { MapPin, Clock, X, UserRound } from 'lucide-react';
import type { Match } from '../types';
import { useMatch } from '../hooks/useMatches';
import { dateLabel, kickoff, scoreText, stageLabel } from '../lib/format';
import { Crest } from './Crest';
export function MatchDetail({
  match,
  onClose,
  demo = false,
  history = false,
  context = [],
}: {
  match: Match;
  onClose: () => void;
  demo?: boolean;
  history?: boolean;
  context?: Match[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const detail = useMatch(match.id, !demo && !history);
  const m = history ? match : (detail.data?.data ?? match);
  useEffect(() => {
    const el = dialog.current;
    const previous = document.activeElement as HTMLElement;
    el?.showModal();
    return () => {
      el?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="match-dialog"
      aria-labelledby="detail-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="detail-inner">
        <div className="detail-heading">
          <span>
            {history
              ? 'Archived result'
              : demo
                ? 'Historical replay'
                : 'Match centre'}
          </span>
          <button
            autoFocus
            onClick={onClose}
            className="icon-button"
            aria-label="Close match details"
          >
            <X size={22} />
          </button>
        </div>
        <p className="quiet">
          {stageLabel(m.stage)}
          {m.matchday ? ` / Matchday ${m.matchday}` : ''}
        </p>
        <h2 id="detail-title">
          {m.home.shortName} vs {m.away.shortName}
        </h2>
        <div className="detail-score">
          <Crest team={m.home} />
          <strong>{scoreText(m.score)}</strong>
          <Crest team={m.away} />
        </div>
        <p className="detail-status">
          {m.status === 'PAUSED' ? 'Half-time' : stageLabel(m.status)}
        </p>
        {m.resultNote && <p className="detail-status">{m.resultNote}</p>}
        {m.source && (
          <p>
            <a href={m.source} target="_blank" rel="noreferrer">
              View match source
            </a>
          </p>
        )}
        <dl className="detail-facts">
          <div>
            <dt>
              <Clock size={16} />
              Kickoff
            </dt>
            <dd>
              {dateLabel(m.utcDate)}, {kickoff(m.utcDate)} local time
            </dd>
          </div>
          <div>
            <dt>
              <MapPin size={16} />
              Venue
            </dt>
            <dd>{m.venue ?? 'Not supplied by the feed'}</dd>
          </div>
          <div>
            <dt>
              <UserRound size={16} />
              Referee
            </dt>
            <dd>{m.referee ?? 'Not supplied by the feed'}</dd>
          </div>
          <div>
            <dt>Half-time</dt>
            <dd>{scoreText(m.halfTime)}</dd>
          </div>
          <div>
            <dt>Full-time</dt>
            <dd>{scoreText(m.fullTime)}</dd>
          </div>
        </dl>
        <p className="section-note">
          Reported attendance:{' '}
          {m.attendance?.toLocaleString() ?? 'Not supplied'}. This is not a
          ticket-sales or revenue figure.
        </p>
        <MatchAnalysis match={m} context={context} />
        {detail.isFetching && <p className="quiet">Updating match details…</p>}
        {detail.isError && (
          <p className="quiet">
            Additional details are unavailable.{' '}
            <button
              className="text-button"
              onClick={() => void detail.refetch()}
            >
              Try again
            </button>
          </p>
        )}
      </div>
    </dialog>
  );
}
