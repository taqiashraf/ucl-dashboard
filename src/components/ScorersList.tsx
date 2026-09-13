import { useState } from 'react';
import type { ScorerRow } from '../types';
import { Crest } from './Crest';
export function ScorersList({
  rows,
  compact = false,
}: {
  rows: ScorerRow[];
  compact?: boolean;
}) {
  const [metric, setMetric] = useState<'goals' | 'assists'>('goals');
  const active = compact ? 'goals' : metric;
  const sorted = [...rows]
    .filter((r) => active === 'goals' || r.assists !== null)
    .sort(
      (a, b) =>
        (b[active] ?? 0) - (a[active] ?? 0) || a.name.localeCompare(b.name),
    );
  const shown = compact ? sorted.slice(0, 5) : sorted;
  return (
    <div className="scorers">
      {!compact && (
        <>
          <div className="segmented" aria-label="Player statistic">
            <button
              aria-pressed={active === 'goals'}
              onClick={() => setMetric('goals')}
            >
              Goals
            </button>
            <button
              aria-pressed={active === 'assists'}
              onClick={() => setMetric('assists')}
            >
              Assists
            </button>
          </div>
          <p className="section-note">
            {active === 'assists'
              ? `Available assists among ${rows.length} top goalscorers; ${sorted.length} players have reported values. This is not a competition-wide assist leaderboard.`
              : 'Top goalscorers in the connected feed. A dash means the provider has not supplied a value.'}
          </p>
          {shown[0] && (
            <div className="player-spotlight">
              <Crest team={shown[0].team} />
              <div>
                <small>
                  {active === 'goals'
                    ? 'Leading scorer'
                    : 'Highest reported assists in this sample'}
                </small>
                <h3>{shown[0].name}</h3>
                <span>{shown[0].team.shortName}</span>
              </div>
              <strong>
                {shown[0][active]} <small>{active}</small>
              </strong>
            </div>
          )}
        </>
      )}
      <div className="scorer-columns">
        <span>Player</span>
        <span>
          {!compact ? 'Goals · Assists · Played / ' : ''}
          {active === 'goals' ? 'Goals' : 'Assists'}
        </span>
      </div>
      {!shown.length && <p>No reported {active} values are available.</p>}
      <ol>
        {shown.map((row, index) => (
          <li key={row.id}>
            <span className="scorer-rank">{index + 1}</span>
            <Crest team={row.team} />
            <span className="scorer-name">
              <strong>{row.name}</strong>
              <span>{row.team.shortName}</span>
            </span>
            {!compact && (
              <span
                className="scorer-extra"
                aria-label={`${row.goals} goals, ${row.assists ?? 'unknown'} assists, ${row.played ?? 'unknown'} appearances`}
              >
                {row.goals} · {row.assists ?? '—'} · {row.played ?? '—'}
              </span>
            )}
            <strong
              className="scorer-goals"
              aria-label={`${row[active]} ${active}`}
            >
              {row[active]}
            </strong>
          </li>
        ))}
      </ol>
    </div>
  );
}
