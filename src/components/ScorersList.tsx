import type { ScorerRow } from '../types';
import { Crest } from './Crest';
export function ScorersList({
  rows,
  compact = false,
}: {
  rows: ScorerRow[];
  compact?: boolean;
}) {
  return (
    <div className="scorers">
      <div className="scorer-columns">
        <span>Player</span>
        <span>{!compact ? 'Assists / played / ' : ''}Goals</span>
      </div>
      <ol>
        {(compact ? rows.slice(0, 5) : rows).map((row, index) => (
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
                aria-label={`${row.assists ?? 'Unknown'} assists, ${row.played ?? 'unknown'} appearances`}
              >
                {row.assists ?? '–'} / {row.played ?? '–'}
              </span>
            )}
            <strong className="scorer-goals" aria-label={`${row.goals} goals`}>
              {row.goals}
            </strong>
          </li>
        ))}
      </ol>
    </div>
  );
}
