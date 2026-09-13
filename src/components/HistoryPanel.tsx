import { archiveSeasons } from '../lib/seasons';
import { Bracket } from './Bracket';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Match } from '../types';
import { MatchRow } from './MatchRow';
import { Skeleton } from './states/Skeleton';
import { dateLabel } from '../lib/format';
interface Archive {
  season: string;
  updatedAt: string;
  source: string;
  coverage: string;
  matches: Match[];
}
export function HistoryPanel({
  onSelect,
}: {
  onSelect: (match: Match, context?: Match[]) => void;
}) {
  const [year, setYear] = useState(String(archiveSeasons[0].year));
  const [view, setView] = useState('results');
  const [limit, setLimit] = useState(24);
  const query = useQuery<Archive>({
    queryKey: ['history', year],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/history/${year}.json`, { signal });
      if (!response.ok) throw new Error('Archive unavailable');
      return response.json();
    },
    staleTime: Infinity,
    retry: false,
  });
  const archive = query.data;
  const rows = archive?.matches.slice(0, limit) ?? [];
  return (
    <section
      id="panel-history"
      role="tabpanel"
      aria-labelledby="tab-history"
      className="history-panel"
    >
      <div className="section-heading">
        <h2>Recent seasons & results</h2>
        <label className="season-picker">
          Season{' '}
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setLimit(24);
            }}
          >
            {archiveSeasons.map((s) => (
              <option key={s.year} value={s.year}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="segmented" aria-label="History display">
        {['results', 'bracket'].map((v) => (
          <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
            {v === 'results' ? 'Results' : 'Bracket'}
          </button>
        ))}
      </div>
      <p className="section-note">
        Browse completed matches without an API account. Select a match for
        details.
      </p>
      {query.isPending && <Skeleton rows={5} />}
      {query.isError && (
        <p role="status">
          Couldn’t load the results archive.{' '}
          <button onClick={() => void query.refetch()}>Try again</button>
        </p>
      )}
      {archive && (
        <>
          <p className="section-note">
            {archive.matches.length} completed matches · Updated{' '}
            {dateLabel(archive.updatedAt)}. {archive.coverage}{' '}
            <a href={archive.source} target="_blank" rel="noreferrer">
              ESPN source
            </a>
          </p>
          {view === 'bracket' && (
            <Bracket
              matches={archive.matches}
              onSelect={(m) => onSelect(m, archive.matches)}
            />
          )}
          {view === 'results' &&
            rows.map((match, index) => (
              <div key={match.id} className="history-result">
                {(index === 0 ||
                  dateLabel(rows[index - 1].utcDate) !==
                    dateLabel(match.utcDate)) && (
                  <h3>{dateLabel(match.utcDate)}</h3>
                )}
                <MatchRow
                  match={match}
                  onSelect={(m) => onSelect(m, archive.matches)}
                />
                {match.resultNote && (
                  <p className="result-note">
                    {match.home.shortName} / {match.away.shortName} ·{' '}
                    {match.resultNote}
                  </p>
                )}
              </div>
            ))}
          {view === 'results' && limit < archive.matches.length && (
            <button
              className="history-more"
              onClick={() => setLimit((n) => n + 24)}
            >
              Show more results ({archive.matches.length - limit} remaining)
            </button>
          )}
        </>
      )}
    </section>
  );
}
