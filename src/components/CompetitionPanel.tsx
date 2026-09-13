import { historicalTables } from '../lib/historicalTables';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Match, StandingRow } from '../types';
import { StandingsTable } from './StandingsTable';
import { Bracket } from './Bracket';
import { archiveSeasons } from '../lib/seasons';
import { summarizeMatches } from '../lib/insights';
export function CompetitionPanel({
  rows,
  matches,
  compact,
  onSelect,
}: {
  rows: StandingRow[];
  matches: Match[];
  compact: boolean;
  onSelect: (m: Match) => void;
}) {
  const [view, setView] = useState('table');
  const [year, setYear] = useState(
    String(
      archiveSeasons.find((s) => s.year < archiveSeasons[0].year)?.year ??
        archiveSeasons[0].year,
    ),
  );
  const prior = useQuery<{ matches: Match[] }>({
    queryKey: ['comparison', year],
    enabled: view === 'compare',
    queryFn: async ({ signal }) => {
      const r = await fetch(`/history/${year}.json`, { signal });
      if (!r.ok) throw new Error('Archive unavailable');
      return r.json();
    },
    staleTime: Infinity,
    retry: false,
  });
  const current = summarizeMatches(matches),
    previous = summarizeMatches(prior.data?.matches ?? []);
  if (compact) return <StandingsTable rows={rows} compact />;
  return (
    <>
      <div className="segmented" aria-label="Competition view">
        {['table', 'bracket', 'compare'].map((v) => (
          <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
            {v === 'table'
              ? 'Table'
              : v === 'bracket'
                ? 'Bracket'
                : 'Compare seasons'}
          </button>
        ))}
      </div>
      {view === 'table' && <StandingsTable rows={rows} />}
      {view === 'bracket' && <Bracket matches={matches} onSelect={onSelect} />}
      {view === 'compare' && (
        <div className="season-comparison">
          <label className="season-picker">
            Compare with{' '}
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              {archiveSeasons.map((s) => (
                <option key={s.year} value={s.year}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <p className="section-note">
            Season-level comparison, not historical official standings. Current
            results may be an early-season sample. Older group-stage and newer
            league-phase formats have different match counts; compare rates
            cautiously.
          </p>
          {prior.isPending ? (
            <p>Loading comparison…</p>
          ) : prior.isError ? (
            <p role="status">
              Comparison unavailable.{' '}
              <button onClick={() => void prior.refetch()}>Retry</button>
            </p>
          ) : (
            <table className="comparison-table">
              <caption>Current feed versus selected season results</caption>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Current feed</th>
                  <th>
                    {year}/{String(Number(year) + 1).slice(-2)}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Completed matches</th>
                  <td>{current.completed}</td>
                  <td>{previous.completed}</td>
                </tr>
                <tr>
                  <th>Goals per match</th>
                  <td>{current.goalsPerMatch?.toFixed(2) ?? '—'}</td>
                  <td>{previous.goalsPerMatch?.toFixed(2) ?? '—'}</td>
                </tr>
                <tr>
                  <th>Close results</th>
                  <td>
                    {current.closeRate === null
                      ? '—'
                      : `${Math.round(current.closeRate * 100)}%`}
                  </td>
                  <td>
                    {previous.closeRate === null
                      ? '—'
                      : `${Math.round(previous.closeRate * 100)}%`}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
          {prior.data && (
            <>
              <h3>Reconstructed historical table</h3>
              <p className="section-note">
                Calculated from archived group/league results. Sorted by points,
                goal difference, goals scored and name. Historical head-to-head
                and other UEFA tie-breakers are not applied; displayed order is
                not an official qualification ranking.
              </p>
              {historicalTables(prior.data.matches).map((group) => (
                <section key={group.name}>
                  <h4>{group.name}</h4>
                  <StandingsTable rows={group.rows} historical />
                </section>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
}
