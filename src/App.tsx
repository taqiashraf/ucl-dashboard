import { useState, useSyncExternalStore } from 'react';
import { Star, Moon, Sun, ExternalLink, Info } from 'lucide-react';
import {
  useMatches,
  useStandings,
  useScorers,
  useDemo,
} from './hooks/useMatches';
import { HistoryPanel } from './components/HistoryPanel';
import { Tabs, type Tab } from './components/Tabs';
import { MatchRow } from './components/MatchRow';
import { MatchDetail } from './components/MatchDetail';
import { StandingsTable } from './components/StandingsTable';
import { ScorersList } from './components/ScorersList';
import { LiveStrip } from './components/LiveStrip';
import { RefreshStatus } from './components/RefreshStatus';
import { Skeleton } from './components/states/Skeleton';
import { EmptyState } from './components/states/EmptyState';
import { ErrorState } from './components/states/ErrorState';
import { groupByDate, dateLabel } from './lib/format';
import { isLive } from './lib/time';
import { demoMode, ApiError } from './lib/api';
import type { Match } from './types';
const subscribeTheme = (listener: () => void) => {
  const q = window.matchMedia('(prefers-color-scheme: dark)');
  q.addEventListener('change', listener);
  return () => q.removeEventListener('change', listener);
};
function App() {
  const [tab, setTab] = useState<Tab>(
    new URLSearchParams(window.location.search).get('view') === 'history'
      ? 'history'
      : 'matches',
  );
  const [selected, setSelected] = useState<Match | null>(null);
  const [theme, setTheme] = useState<boolean | null>(null);
  const systemDark = useSyncExternalStore(
    subscribeTheme,
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false,
  );
  const dark = theme ?? systemDark;
  const history = tab === 'history';
  const demo = demoMode() && !history;
  const archive = useDemo(demo);
  const matches = useMatches(!demo && !history);
  const standings = useStandings(!demo && !history);
  const scorers = useScorers(!demo && !history);
  const review = demo
    ? new URLSearchParams(window.location.search).get('state')
    : null;
  const data =
    review === 'empty'
      ? []
      : demo
        ? (archive.data?.matches ?? [])
        : (matches.data?.data ?? []);
  const table = demo ? archive.data?.standings : standings.data?.data;
  const leaders = demo ? archive.data?.scorers : scorers.data?.data;
  const loading =
    review === 'loading' ||
    (demo ? archive.isPending : matches.isPending && matches.isFetching);
  const error =
    review === 'error'
      ? new ApiError(502, 4, 0, 'review_error')
      : demo
        ? archive.error
        : matches.error;
  const stale =
    review === 'stale' ||
    matches.data?.stale ||
    (!demo && !!matches.error && !!matches.data);
  const receivedAt = demo
    ? Date.parse(archive.data?.replayAt ?? '2024-10-01T19:50Z')
    : matches.dataUpdatedAt;
  const updatedAt = demo ? archive.data?.replayAt : matches.data?.updatedAt;
  const fixtures = data.filter((m) => !isLive(m) && m.status !== 'FINISHED');
  const results = data
    .filter((m) => m.status === 'FINISHED')
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
    .slice(0, 18);
  const season = demo ? (archive.data?.season ?? '2024/25') : '2026/27';
  const retry = () => {
    void (demo ? archive.refetch() : matches.refetch());
  };
  return (
    <div className={`app ${dark ? 'dark' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to matches
      </a>
      <header className="site-header">
        <a
          href="/"
          className="brand"
          aria-label="Champions League dashboard home"
        >
          <span className="brand-mark">
            <Star size={25} fill="currentColor" />
          </span>
          <span>
            Matchday<span className="brand-sub">Champions League</span>
          </span>
        </a>
        <div className="header-right">
          <RefreshStatus
            history={history}
            notConfigured={
              error instanceof ApiError && error.code === 'feed_not_configured'
            }
            updatedAt={updatedAt}
            fetching={!demo && matches.isFetching}
            error={!!error}
            replay={demo}
            stale={!!stale}
          />
          <button
            className="icon-button"
            onClick={() => setTheme(!dark)}
            aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>
      <main id="main" className="page">
        {demo && (
          <div className="demo-banner">
            <Info size={16} />
            <span>
              <strong>Historical demo</strong> — {season}.{' '}
              {archive.data?.mode === 'live-capture'
                ? 'Frozen matchday snapshot'
                : 'Reconstructed half-time scores'}
              ; not live today.
            </span>
            <a href="/">Return to live mode</a>
          </div>
        )}
        {review && (
          <div className="review-banner">
            Reviewing the {review} state.{' '}
            <a href="?demo=1">Back to historical demo</a>
          </div>
        )}
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              UEFA Champions League / {history ? 'Results archive' : season}
            </p>
            <h1>
              Every match.
              <br className="mobile-break" /> One place.
            </h1>
          </div>
          <span className="heading-note">
            {demo
              ? 'League phase / Matchday 2'
              : 'Fixtures, results & the race to qualify'}
          </span>
        </div>
        {!history && (
          <LiveStrip
            matches={loading || review === 'error' ? [] : data}
            onSelect={setSelected}
            receivedAt={receivedAt}
            replayAt={demo ? archive.data?.replayAt : undefined}
            loading={loading}
            unavailable={!!error && !data.length}
          />
        )}
        <Tabs active={tab} onChange={setTab} />
        <div className={`dashboard-grid view-${tab}`}>
          <section
            id="panel-matches"
            role="tabpanel"
            aria-labelledby="tab-matches"
            hidden={tab !== 'matches'}
            className="matches-panel"
          >
            <div className="section-heading">
              <h2>Fixtures & results</h2>
              <span className="quiet">Local kickoff times</span>
            </div>
            {stale && (
              <div className="stale-state">
                {review === 'stale'
                  ? 'Showing data from 4 minutes ago.'
                  : `Showing cached scores from ${updatedAt ? new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'the last update'}.`}{' '}
                Reconnecting to the feed.
              </div>
            )}
            {error && (
              <ErrorState
                error={error}
                retry={retry}
                errorAt={demo ? archive.errorUpdatedAt : matches.errorUpdatedAt}
                fetching={!demo && matches.isFetching}
              />
            )}
            {loading ? (
              <Skeleton rows={5} />
            ) : review === 'error' ? null : !data.length && !error ? (
              <EmptyState />
            ) : (
              <>
                {[
                  ...groupByDate(fixtures),
                  ...groupByDate(results).reverse(),
                ].map(([day, rows]) => (
                  <section className="date-group" key={day + rows[0].status}>
                    <h3>
                      {dateLabel(rows[0].utcDate)}
                      <span>
                        {rows[0].status === 'FINISHED' ? 'Results' : 'Fixtures'}
                      </span>
                    </h3>
                    {rows.map((m) => (
                      <MatchRow
                        key={m.id}
                        match={m}
                        onSelect={setSelected}
                        receivedAt={receivedAt}
                      />
                    ))}
                  </section>
                ))}
                {!fixtures.length && !results.length && data.some(isLive) && (
                  <EmptyState message="All matches in this window are in progress. Follow the scores above." />
                )}
              </>
            )}
          </section>
          {history && <HistoryPanel onSelect={setSelected} />}
          {!history && (
            <aside className="side-rail">
              <section
                id="panel-table"
                role="tabpanel"
                aria-labelledby="tab-table"
                className={`rail-section ${tab === 'scorers' ? 'hide-section' : ''}`}
              >
                <div className="section-heading">
                  <h2>League standings</h2>
                  {tab === 'matches' && (
                    <button
                      className="text-button"
                      onClick={() => setTab('table')}
                    >
                      Full table
                    </button>
                  )}
                </div>
                {demo && archive.data && (
                  <p className="section-note">{archive.data.standingsNote}</p>
                )}
                {!demo && standings.error && (
                  <ErrorState
                    error={standings.error}
                    retry={() => void standings.refetch()}
                    subject="league table"
                    errorAt={standings.errorUpdatedAt}
                    fetching={standings.isFetching}
                  />
                )}
                {(
                  demo
                    ? archive.isPending
                    : standings.isPending && standings.isFetching
                ) ? (
                  <Skeleton rows={8} />
                ) : table?.length ? (
                  <StandingsTable rows={table} compact={tab === 'matches'} />
                ) : (
                  !standings.error && (
                    <EmptyState message="The league-phase table is not available yet." />
                  )
                )}
              </section>
              <section
                id="panel-scorers"
                role="tabpanel"
                aria-labelledby="tab-scorers"
                className={`rail-section ${tab === 'table' ? 'hide-section' : ''}`}
              >
                <div className="section-heading">
                  <h2>Top scorers</h2>
                  {tab === 'matches' && (
                    <button
                      className="text-button"
                      onClick={() => setTab('scorers')}
                    >
                      All scorers
                    </button>
                  )}
                </div>
                {demo && archive.data && (
                  <p className="section-note">{archive.data.scorersNote}</p>
                )}
                {!demo && scorers.error && (
                  <ErrorState
                    error={scorers.error}
                    retry={() => void scorers.refetch()}
                    subject="scorer statistics"
                    errorAt={scorers.errorUpdatedAt}
                    fetching={scorers.isFetching}
                  />
                )}
                {(
                  demo
                    ? archive.isPending
                    : scorers.isPending && scorers.isFetching
                ) ? (
                  <Skeleton rows={5} />
                ) : leaders?.length ? (
                  <ScorersList rows={leaders} compact={tab === 'matches'} />
                ) : (
                  !scorers.error && (
                    <EmptyState message="Scorer statistics are not available for this season yet." />
                  )
                )}
              </section>
            </aside>
          )}
        </div>
        <footer>
          <span>
            An independent football dashboard. Not affiliated with UEFA.
          </span>
          <a
            href={
              demo
                ? 'https://www.espn.com/soccer/match/_/gameId/720443/paris-saint-germain-arsenal'
                : 'https://www.football-data.org'
            }
            target="_blank"
            rel="noreferrer"
          >
            {demo
              ? 'Historical facts: ESPN archive'
              : 'Provider adapters: football-data.org / API-Football'}{' '}
            <ExternalLink size={12} />
          </a>
          <span>
            {demo
              ? 'Original match dates preserved.'
              : 'Scores may be delayed.'}{' '}
            No tracking.
          </span>
        </footer>
      </main>
      {selected && (
        <MatchDetail
          match={selected}
          demo={demo}
          history={history}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
export default App;
