import {
  describe,
  expect,
  it,
  vi,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { LiveStrip } from '../src/components/LiveStrip';
import { EmptyState } from '../src/components/states/EmptyState';
import { StandingsTable } from '../src/components/StandingsTable';
import { ErrorState } from '../src/components/states/ErrorState';
import { Tabs } from '../src/components/Tabs';
import { useMatches } from '../src/hooks/useMatches';
import { intervalFor } from '../src/hooks/useLivePolling';
import { ApiError } from '../src/lib/api';
import snapshot from '../public/demo/snapshot.json';
import type { Match, StandingRow } from '../src/types';
const matches = snapshot.matches as Match[];
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
describe('matchday interface', () => {
  it('shows live indicator only when a match has a live status', () => {
    const { rerender } = render(
      <LiveStrip
        matches={matches}
        onSelect={vi.fn()}
        receivedAt={0}
        replayAt={snapshot.replayAt}
      />,
    );
    expect(
      screen.getByLabelText('7 matches in play in historical replay'),
    ).toBeInTheDocument();
    rerender(<LiveStrip matches={[]} onSelect={vi.fn()} receivedAt={0} />);
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Next match' }),
    ).toBeInTheDocument();
  });
  it('opens the correct match when a live card is selected', () => {
    const select = vi.fn();
    render(
      <LiveStrip
        matches={matches}
        onSelect={select}
        receivedAt={0}
        replayAt={snapshot.replayAt}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Arsenal versus Paris/ }),
    );
    expect(select.mock.calls[0][0].home.name).toBe('Arsenal');
  });
  it('renders meaningful empty content', () => {
    render(<EmptyState />);
    expect(screen.getByText(/No Champions League matches/)).toBeInTheDocument();
  });
  it('renders all 36 clubs with correct qualification bands', () => {
    const { container } = render(
      <StandingsTable rows={snapshot.standings as StandingRow[]} />,
    );
    expect(screen.getAllByRole('row')).toHaveLength(37);
    expect(container.querySelectorAll('.band-direct')).toHaveLength(8);
    expect(container.querySelectorAll('.band-playoff')).toHaveLength(16);
    expect(container.querySelectorAll('.band-out')).toHaveLength(12);
  });
  it('supports arrow keyboard navigation', () => {
    const change = vi.fn();
    render(<Tabs active="matches" onChange={change} />);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Matches' }), {
      key: 'ArrowRight',
    });
    expect(change).toHaveBeenCalledWith('table');
    expect(screen.getByRole('tab', { name: 'Table' })).toHaveFocus();
  });
  it('stops timers while hidden and honors retry-after', () => {
    expect(intervalFor(matches, null, false)).toBe(false);
    expect(
      intervalFor(
        matches,
        new ApiError(429, 3, 30, 'upstream_unavailable'),
        true,
      ),
    ).toBe(30000);
  });
  it('uses MSW to verify retry refetches after an error', async () => {
    let calls = 0;
    server.use(
      http.get('/api/cl/matches', () => {
        calls++;
        return calls === 1
          ? HttpResponse.json(
              { error: 'upstream_unavailable' },
              { status: 502 },
            )
          : HttpResponse.json({
              data: [],
              updatedAt: new Date().toISOString(),
              stale: false,
            });
      }),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    function Feed() {
      const q = useMatches();
      return q.error ? (
        <ErrorState
          error={q.error}
          retry={() => void q.refetch()}
          errorAt={q.errorUpdatedAt}
        />
      ) : q.data ? (
        <EmptyState />
      ) : null;
    }
    render(
      <QueryClientProvider client={client}>
        <Feed />
      </QueryClientProvider>,
    );
    await screen.findByText('Couldn’t reach the match feed.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByText(/No Champions League matches/);
    expect(calls).toBe(2);
    client.clear();
  });
  it('refetches immediately when visibility returns', async () => {
    let calls = 0;
    let state = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => state,
    });
    server.use(
      http.get('/api/cl/matches', () => {
        calls++;
        return HttpResponse.json({
          data: [],
          updatedAt: new Date().toISOString(),
          stale: false,
        });
      }),
    );
    const client = new QueryClient();
    function Feed() {
      useMatches();
      return null;
    }
    render(
      <QueryClientProvider client={client}>
        <Feed />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(calls).toBe(1));
    state = 'hidden';
    fireEvent(document, new Event('visibilitychange'));
    state = 'visible';
    fireEvent(document, new Event('visibilitychange'));
    await waitFor(() => expect(calls).toBe(2));
    client.clear();
    delete (document as unknown as { visibilityState?: string })
      .visibilityState;
  });
});

import { HistoryPanel } from '../src/components/HistoryPanel';
import { RefreshStatus } from '../src/components/RefreshStatus';
import history2025 from '../public/history/2025.json';
import history2026 from '../public/history/2026.json';
import { archiveSeasons } from '../src/lib/seasons';
describe('results archive', () => {
  it('keeps completed scores and the final shootout distinct', () => {
    expect(history2025.matches).toHaveLength(189);
    expect(history2026.matches.length).toBeGreaterThanOrEqual(18);
    expect(
      [...history2025.matches, ...history2026.matches].every(
        (m) => m.status === 'FINISHED',
      ),
    ).toBe(true);
    expect(history2025.matches[0].score).toEqual({ home: 1, away: 1 });
    expect(history2025.matches[0].resultNote).toContain('Penalties: 4–3');
  });
  it('loads both seasons without calling the live proxy and expands older results', async () => {
    server.use(
      http.get(`/history/${archiveSeasons[0].year}.json`, () =>
        HttpResponse.json(history2026),
      ),
      http.get(`/history/${archiveSeasons[1].year}.json`, () =>
        HttpResponse.json(history2025),
      ),
    );
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <HistoryPanel onSelect={vi.fn()} />
      </QueryClientProvider>,
    );
    await screen.findByText(
      new RegExp(`${history2026.matches.length} completed matches`),
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Season' }), {
      target: { value: String(archiveSeasons[1].year) },
    });
    await screen.findByText(/189 completed matches/);
    expect(
      screen.getAllByRole('button', { name: /Match details/ }),
    ).toHaveLength(24);
    fireEvent.click(screen.getByRole('button', { name: /Show more results/ }));
    expect(
      screen.getAllByRole('button', { name: /Match details/ }),
    ).toHaveLength(48);
  });
  it('identifies missing setup instead of claiming to reconnect', () => {
    render(<RefreshStatus fetching={false} error notConfigured />);
    expect(screen.getByText('Setup required')).toBeInTheDocument();
    expect(screen.queryByText('Reconnecting')).not.toBeInTheDocument();
  });
});

import { ScorersList } from '../src/components/ScorersList';
import { PartnerCaseStudy } from '../src/components/PartnerCaseStudy';
describe('business and player controls', () => {
  it('switches to reported assists and excludes unknown values', () => {
    const team = matches[0].home;
    render(
      <ScorersList
        rows={[
          {
            id: 1,
            name: 'Goal leader',
            team,
            goals: 9,
            assists: null,
            played: 3,
          },
          {
            id: 2,
            name: 'Assist leader',
            team,
            goals: 2,
            assists: 4,
            played: 3,
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Assists' }));
    expect(
      screen.getByText(/not a competition-wide assist leaderboard/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Goal leader')).not.toBeInTheDocument();
    expect(screen.getByLabelText('4 assists')).toBeInTheDocument();
  });
  it('changes the fictional partner scope and highlights delivery gaps', () => {
    render(<PartnerCaseStudy />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Partner' }), {
      target: { value: 'Northstar Travel' },
    });
    expect(screen.getByText('79.2%')).toBeInTheDocument();
    expect(
      screen.getByText(/Resolve 2 underdelivered asset lines/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Portfolio exercise · synthetic data/),
    ).toBeInTheDocument();
  });
});
