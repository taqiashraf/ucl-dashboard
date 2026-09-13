import { MatchDetail } from './MatchDetail';
import { PartnerCaseStudy } from './PartnerCaseStudy';
import {
  archiveSeasons,
  feedSeason,
  seasonStart,
  seasonLabel,
} from '../lib/seasons';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, ArrowUpRight, Info } from 'lucide-react';
import type { Match, ScorerRow } from '../types';
import { summarizeMatches, valueScenario, csvCell } from '../lib/insights';
import { Skeleton } from './states/Skeleton';
interface Archive {
  matches: Match[];
  updatedAt: string;
}
const number = (n: number) =>
  n.toLocaleString('en-US', { maximumFractionDigits: 1 });
const dollars = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
function Bars({
  rows,
  label,
  unit,
}: {
  rows: { name: string; value: number }[];
  label: string;
  unit: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div
      className="bi-bars"
      role="img"
      aria-label={`${label}. ${rows.map((r) => `${r.name}: ${number(r.value)} ${unit}`).join('; ')}`}
    >
      {rows.map((r) => (
        <div className="bi-bar-row" key={r.name}>
          <span>{r.name}</span>
          <svg
            viewBox="0 0 200 14"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect width="200" height="14" rx="3" className="bi-track" />
            <rect
              width={(r.value / max) * 200}
              height="14"
              rx="3"
              className="bi-fill"
            />
          </svg>
          <strong>{number(r.value)}</strong>
        </div>
      ))}
    </div>
  );
}
export function InsightsPanel({
  matches,
  scorers,
  updatedAt,
  error,
  loading,
}: {
  matches: Match[];
  scorers: ScorerRow[];
  updatedAt?: string;
  error: boolean;
  loading: boolean;
}) {
  const [brief, setBrief] = useState<Match | null>(null);
  const [mode, setMode] = useState('plan');
  const [source, setSource] = useState('live');
  const [club, setClub] = useState('all');
  const [impressions, setImpressions] = useState(1000000);
  const [cpm, setCpm] = useState(12);
  const [quality, setQuality] = useState(50);
  const [fee, setFee] = useState(10000);
  const archive = useQuery<Archive>({
    queryKey: ['bi-archive', source],
    enabled: source !== 'live',
    queryFn: async ({ signal }) => {
      const r = await fetch(`/history/${source}.json`, { signal });
      if (!r.ok) throw new Error('Archive unavailable');
      return r.json();
    },
    staleTime: Infinity,
    retry: false,
  });
  const rows = source === 'live' ? matches : (archive.data?.matches ?? []);
  const updated = source === 'live' ? updatedAt : archive.data?.updatedAt;
  const stats = summarizeMatches(rows, club);
  const teams = [
    ...new Map(
      rows.flatMap(
        (m) =>
          [
            [String(m.home.id), m.home.shortName],
            [String(m.away.id), m.away.shortName],
          ] as [string, string][],
      ),
    ),
  ].sort((a, b) => a[1].localeCompare(b[1]));
  const scenario = valueScenario(impressions, cpm, quality, fee);
  const availableAssists = scorers.filter((s) => s.assists !== null);
  const players = scorers
    .filter((s) => club === 'all' || String(s.team.id) === club)
    .filter((s) => s.assists !== null)
    .sort((a, b) => b.goals + b.assists! - (a.goals + a.assists!))
    .slice(0, 8);
  const busy = source === 'live' ? loading : archive.isPending;
  const unavailable = source === 'live' ? error : archive.isError;
  function exportKpis() {
    const records = [
      ['Metric', 'Value', 'Scope', 'Source', 'Updated', 'Definition'],
      [
        'Completed matches',
        stats.completed,
        club,
        source,
        updated ?? '',
        'FINISHED records in selected scope',
      ],
      [
        'Valid score coverage',
        `${stats.scored}/${stats.completed}`,
        club,
        source,
        updated ?? '',
        'Completed records with both scores present',
      ],
      [
        'Goals per match',
        stats.goalsPerMatch ?? 'Unavailable',
        club,
        source,
        updated ?? '',
        'Both teams goals / completed matches with scores',
      ],
      [
        'Close result share',
        stats.closeRate ?? 'Unavailable',
        club,
        source,
        updated ?? '',
        'Final goal difference <= 1 / completed matches with scores',
      ],
      [
        'Scheduled fixtures',
        stats.scheduled,
        club,
        source,
        updated ?? '',
        'TIMED and SCHEDULED records; not sponsor inventory',
      ],
    ];
    const blob = new Blob(
      ['\ufeff' + records.map((r) => r.map(csvCell).join(',')).join('\r\n')],
      { type: 'text/csv;charset=utf-8;' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matchday-measured-kpis.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section
      id="panel-insights"
      role="tabpanel"
      aria-labelledby="tab-insights"
      className="bi-panel"
    >
      <div className="bi-intro">
        <div>
          <p className="eyebrow">
            <BarChart3 size={16} /> Partnership intelligence
          </p>
          <h2>What decision are you making?</h2>
          <p className="section-note">
            Start with match planning, review a sample partner campaign, or test
            a proposed package price.
          </p>
        </div>
        <button
          className="bi-button"
          onClick={exportKpis}
          disabled={!rows.length}
          hidden={mode !== 'plan'}
        >
          <Download size={16} /> Export KPIs
        </button>
      </div>
      <div className="segmented insight-modes" aria-label="Business question">
        {[
          ['plan', '1. Plan matchdays'],
          ['partner', '2. Review a partner'],
          ['value', '3. Test a price'],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={mode === id}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'partner' && <PartnerCaseStudy />}
      <div hidden={mode !== 'plan'}>
        <div className="bi-filters">
          <label>
            Dataset
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setClub('all');
              }}
            >
              <option value="live">
                {seasonLabel(feedSeason(matches) ?? seasonStart())} · connected
                feed
              </option>
              {archiveSeasons.map((s) => (
                <option key={s.year} value={s.year}>
                  {s.label} · results archive
                </option>
              ))}
            </select>
          </label>
          <label>
            Club
            <select value={club} onChange={(e) => setClub(e.target.value)}>
              <option value="all">All clubs</option>
              {teams.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <p className="quiet">
            {source === 'live' ? 'football-data.org' : 'ESPN static archive'}
            <br />
            {updated
              ? `Data updated ${new Date(updated).toLocaleString()}`
              : 'Waiting for data'}{' '}
            · Dates grouped in UTC
          </p>
        </div>
        {unavailable && (
          <p className="bi-notice" role="status">
            {rows.length
              ? 'Showing retained data; refresh failed.'
              : 'This dataset is unavailable. Select a results archive to explore measured KPIs.'}
          </p>
        )}
        {busy ? (
          <Skeleton rows={4} />
        ) : (
          <>
            <div className="recent-briefs">
              <h3>Explore a recent match</h3>
              <p className="section-note">
                Open a match brief for its score, preceding form and goals
                compared with this dataset.
              </p>
              <div>
                {[...rows]
                  .filter((m) => m.status === 'FINISHED')
                  .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
                  .slice(0, 6)
                  .map((m) => (
                    <button key={m.id} onClick={() => setBrief(m)}>
                      {m.home.shortName} {m.score.home}–{m.score.away}{' '}
                      {m.away.shortName}
                      <small>
                        {new Date(m.utcDate).toLocaleDateString()} · View brief
                      </small>
                    </button>
                  ))}
              </div>
            </div>
            <div className="bi-kpis">
              {[
                [
                  'Completed matches',
                  number(stats.completed),
                  'Observed activity in the selected dataset',
                ],
                [
                  'Goals per match',
                  stats.goalsPerMatch === null
                    ? '—'
                    : stats.goalsPerMatch.toFixed(2),
                  'Football performance, not audience reach',
                ],
                [
                  'Close results',
                  stats.closeRate === null
                    ? '—'
                    : `${Math.round(stats.closeRate * 100)}%`,
                  'Draw or one-goal margin; not an engagement measure',
                ],
                [
                  'Scheduled fixtures',
                  number(stats.scheduled),
                  source === 'live'
                    ? 'Potential activation dates; rights not confirmed'
                    : 'Results-only archive excludes future fixtures',
                ],
              ].map(([name, value, note]) => (
                <article className="bi-kpi" key={name}>
                  <span>{name}</span>
                  <strong>{value}</strong>
                  <small>{note}</small>
                </article>
              ))}
            </div>
            <div className="bi-grid">
              <article className="bi-card">
                <div className="bi-card-heading">
                  <h3>Activation calendar</h3>
                  <span className="bi-tag">Measured</span>
                </div>
                <p className="section-note">
                  Match volume by month. Use fixture dates to plan staffing and
                  partner content; confirm rights before booking.
                </p>
                {stats.months.length ? (
                  <>
                    <div
                      className="bi-calendar"
                      role="img"
                      aria-label={stats.months
                        .map(
                          (r) =>
                            `${r.month}: ${r.completed} completed, ${r.scheduled} scheduled`,
                        )
                        .join('; ')}
                    >
                      {stats.months.map((r) => {
                        const max = Math.max(
                          1,
                          ...stats.months.map((m) => m.completed + m.scheduled),
                        );
                        return (
                          <div className="bi-month" key={r.month}>
                            <strong>{r.completed + r.scheduled}</strong>
                            <svg viewBox="0 0 32 110" aria-hidden="true">
                              <rect
                                x="4"
                                y={
                                  110 -
                                  ((r.completed + r.scheduled) / max) * 100
                                }
                                width="24"
                                height={(r.scheduled / max) * 100}
                                className="bi-scheduled"
                              />
                              <rect
                                x="4"
                                y={110 - (r.completed / max) * 100}
                                width="24"
                                height={(r.completed / max) * 100}
                                className="bi-fill"
                              />
                            </svg>
                            <span>{r.month}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="bi-legend">
                      ■ Completed <span>■ Scheduled</span>
                    </p>
                  </>
                ) : (
                  <p>No fixture data in this scope.</p>
                )}
              </article>
              <article className="bi-card">
                <div className="bi-card-heading">
                  <h3>Club scoring output</h3>
                  <span className="bi-tag">Measured</span>
                </div>
                <p className="section-note">
                  Top eight by total goals in selected matches. With a club
                  filter, opponents are included. Totals reflect unequal match
                  counts.
                </p>
                <Bars
                  rows={stats.clubs.slice(0, 8).map((c) => ({
                    name: `${c.name} (${c.played} played)`,
                    value: c.goals,
                  }))}
                  label="Club goals"
                  unit="goals"
                />
              </article>
            </div>
            <article className="bi-takeaway">
              <ArrowUpRight size={22} />
              <div>
                <h3>Your next planning step</h3>
                <p>
                  {stats.scheduled
                    ? `Use the ${stats.scheduled} scheduled fixtures to shortlist activation dates, then overlay partner rights, broadcast markets and campaign deadlines.`
                    : 'Use the completed season as a recap baseline, then load the connected feed to plan upcoming activations.'}{' '}
                  {stats.clubs[0]
                    ? `${stats.clubs[0].name} leads scoring in this scope (${stats.clubs[0].goals} goals across ${stats.clubs[0].played} ${stats.clubs[0].played === 1 ? 'match' : 'matches'}), making it a football-content research lead—not evidence of sponsorship value.`
                    : ''}
                </p>
              </div>
            </article>
            <div className="bi-grid">
              <article className="bi-card">
                <div className="bi-card-heading">
                  <h3>Player contributions</h3>
                  <span className="bi-tag">
                    {source === 'live' ? 'Provider data' : 'Unavailable'}
                  </span>
                </div>
                <p className="section-note">
                  Goals + assists among the feed’s top 20 goalscorers, not an
                  all-player assist leaderboard. Players with missing assists
                  are excluded.
                </p>
                {source === 'live' && players.length ? (
                  <Bars
                    rows={players.map((s) => ({
                      name: s.name,
                      value: s.goals + s.assists!,
                    }))}
                    label="Goals plus assists"
                    unit="contributions"
                  />
                ) : (
                  <p>
                    {source === 'live'
                      ? 'No assist values are available in this scope. Missing assists are not zero.'
                      : 'This archive contains match results only. Choose the connected feed for player contributions.'}
                  </p>
                )}
              </article>
              <article className="bi-card">
                <div className="bi-card-heading">
                  <h3>Data quality & coverage</h3>
                  <span className="bi-tag">Audit</span>
                </div>
                <dl className="bi-quality">
                  <div>
                    <dt>Completed matches with scores</dt>
                    <dd>
                      {stats.scored} / {stats.completed}
                    </dd>
                  </div>
                  <div>
                    <dt>Assist coverage, top-scorer feed</dt>
                    <dd>
                      {source === 'live'
                        ? `${availableAssists.length} / ${scorers.length}`
                        : 'Not in archive'}
                    </dd>
                  </div>
                  <div>
                    <dt>Verified audience / logo exposure</dt>
                    <dd>Not connected</dd>
                  </div>
                  <div>
                    <dt>Ticket sales / paid attendance</dt>
                    <dd>Not connected</dd>
                  </div>
                </dl>
                <p className="section-note">
                  Coverage describes the returned records, not every match or
                  player in the competition. No audience, ticket or sponsor
                  values are inferred from scores.
                </p>
              </article>
            </div>
          </>
        )}
      </div>
      <div hidden={mode !== 'value'}>
        <article className="bi-card bi-scenario">
          <div className="bi-card-heading">
            <div>
              <p className="eyebrow">Commercial planning lab</p>
              <h3>What could a media package be worth?</h3>
            </div>
            <span className="bi-tag">Illustrative assumptions</span>
          </div>
          <p className="section-note">
            An editable CPM-equivalent scenario. Defaults are invented for this
            exercise, not market benchmarks or measured campaign results. USD
            throughout.
          </p>
          <div className="bi-scenario-layout">
            <div className="bi-inputs">
              {[
                {
                  label: 'Gross impressions',
                  value: impressions,
                  set: setImpressions,
                  max: 100000000,
                  step: 10000,
                },
                {
                  label: 'Assumed CPM (USD)',
                  value: cpm,
                  set: setCpm,
                  max: 1000,
                  step: 1,
                },
                {
                  label: 'Assumed quality factor (%)',
                  value: quality,
                  set: setQuality,
                  max: 100,
                  step: 1,
                },
                {
                  label: 'Proposed rights fee (USD)',
                  value: fee,
                  set: setFee,
                  max: 10000000,
                  step: 100,
                },
              ].map((f) => (
                <label key={f.label}>
                  {f.label}
                  <input
                    type="number"
                    min="0"
                    max={f.max}
                    step={f.step}
                    value={f.value}
                    onChange={(e) =>
                      f.set(
                        Math.max(
                          0,
                          Math.min(f.max, Number(e.target.value) || 0),
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <div className="bi-scenario-result">
              <span>Modeled media-equivalent value</span>
              <strong>{dollars(scenario.mediaValue)}</strong>
              <p>
                {scenario.coverage === null
                  ? 'Enter a positive fee to calculate coverage.'
                  : `${scenario.coverage.toFixed(2)}× proposed fee coverage`}
              </p>
              <small>
                This is not revenue, profit, incremental sales or ROI.
              </small>
            </div>
          </div>
          <h4>Sensitivity to the assumed CPM</h4>
          <Bars
            rows={[0.75, 1, 1.25].map((f) => ({
              name: `${f === 1 ? 'Base' : f < 1 ? '−25%' : '+25%'} CPM · ${dollars(cpm * f)}`,
              value: valueScenario(impressions, cpm * f, quality, fee)
                .mediaValue,
            }))}
            label="Modeled media value sensitivity"
            unit="USD"
          />
          <p className="section-note">
            Formula: impressions ÷ 1,000 × CPM × quality factor. Gross
            impressions may include repeated viewers. The quality factor is an
            analyst assumption, not a validated exposure model. Validate
            audience counts and CPM benchmarks before using this in pricing.
          </p>
        </article>
      </div>
      {brief && (
        <MatchDetail
          match={brief}
          history={source !== 'live'}
          context={rows}
          onClose={() => setBrief(null)}
        />
      )}
      <details className="bi-methodology">
        <summary>
          <Info size={16} /> Methodology & the next data connections
        </summary>
        <p>
          Football KPIs use FINISHED matches with two non-null scores. Club
          filters select matches involving that club; goals per match counts
          both sides. Close results have an absolute goal difference of at most
          one. No causal claim about fan engagement is made.
        </p>
        <p>
          Attendance: obtain reported match attendance from a licensed feed or
          official reports; record whether it means tickets distributed or
          turnstile entries. Capacity is not attendance. Ticket revenue: connect
          actual ticket transactions and refunds; asking prices are not realized
          yield.
        </p>
        <p>
          Sponsorship measurement: connect asset-level exposure
          duration/visibility, broadcast audience and authorized social
          analytics. Use contract deliverables and fees for fulfillment; CRM
          opportunity and renewal records for pipeline reporting. Match counts
          alone are not owned or sellable sponsorship inventory.
        </p>
        <p>
          Professional reference:{' '}
          <a
            href="https://blog.relometrics.com/beyond-exposure"
            target="_blank"
            rel="noreferrer"
          >
            Relo Metrics’ exposure and valuation methodology
          </a>
          . This portfolio model is independent and does not replicate its
          proprietary measurement system.
        </p>
      </details>
    </section>
  );
}
