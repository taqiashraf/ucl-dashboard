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
  onSelect: (match: Match) => void;
}) {
  const [year, setYear] = useState('2026');
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
            <option value="2026">2026/27</option>
            <option value="2025">2025/26</option>
          </select>
        </label>
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
          {rows.map((match, index) => (
            <div key={match.id} className="history-result">
              {(index === 0 ||
                dateLabel(rows[index - 1].utcDate) !==
                  dateLabel(match.utcDate)) && (
                <h3>{dateLabel(match.utcDate)}</h3>
              )}
              <MatchRow match={match} onSelect={onSelect} />
              {match.resultNote && (
                <p className="result-note">
                  {match.home.shortName} / {match.away.shortName} ·{' '}
                  {match.resultNote}
                </p>
              )}
            </div>
          ))}
          {limit < archive.matches.length && (
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
