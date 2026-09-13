import type { Match } from '../types';
import { buildBracket } from '../lib/bracket';
import { isLive } from '../lib/time';
import { scoreText, dateLabel } from '../lib/format';
export function Bracket({
  matches,
  onSelect,
}: {
  matches: Match[];
  onSelect: (m: Match) => void;
}) {
  const allRounds = buildBracket(matches);
  const completedFinal = allRounds[4].ties.some((t) =>
    t.some((m) => m.status === 'FINISHED'),
  );
  const rounds = allRounds.filter(
    (r, i) => i !== 0 || r.ties.length || !completedFinal,
  );
  return (
    <div>
      <p className="section-note">
        Confirmed knockout ties by round. Each leg is shown separately; no
        future pairings are guessed. Scores refresh with the connected feed.
        Historical seasons are snapshots.
      </p>
      {!rounds.some((r) => r.ties.length) && (
        <p className="bracket-empty">
          The knockout draw is not available yet. Confirmed ties will appear
          here when the provider publishes them.
        </p>
      )}
      <div
        className="bracket-scroll"
        tabIndex={0}
        aria-label="Knockout bracket, scroll horizontally"
      >
        {rounds.map((round) => (
          <section className="bracket-round" key={round.name}>
            <h3>{round.name}</h3>
            {round.ties.length ? (
              round.ties.map((legs) => (
                <article className="bracket-tie" key={legs[0].id}>
                  {legs.map((m, i) => (
                    <button key={m.id} onClick={() => onSelect(m)}>
                      <small>
                        {legs.length > 1 ? `Leg ${i + 1} · ` : ''}
                        {dateLabel(m.utcDate)}{' '}
                        {isLive(m) && <b className="row-live-label">LIVE</b>}
                      </small>
                      <span>
                        {m.home.shortName}
                        <strong>{m.score.home ?? '—'}</strong>
                      </span>
                      <span>
                        {m.away.shortName}
                        <strong>{m.score.away ?? '—'}</strong>
                      </span>
                      {m.resultNote && <small>{m.resultNote}</small>}
                      <span className="sr-only">
                        {scoreText(m.score)}. Match details
                      </span>
                    </button>
                  ))}
                </article>
              ))
            ) : (
              <div className="bracket-placeholder">
                Awaiting confirmed fixtures
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
