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
