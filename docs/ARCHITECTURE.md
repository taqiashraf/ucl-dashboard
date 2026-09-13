# Architecture

```text
Browser (React SPA)
      | GET /api/cl/matches; no API credential
      v
Netlify Function / Vercel Node HTTP bridge
      | route allowlist -> Zod -> origin and token buckets
      | function memory cache -> provider adapter
      | server-side FOOTBALL_API_KEY
      v
football-data.org v4 (default) / API-Football v3
```

`netlify/functions/_lib/handler.ts` is the shared security boundary. Netlify passes a web Request and platform-derived IP. Vercel adapts Node request/response objects and its platform IP header. The reserved rewrite field is removed before public-query validation. Neither entry point contains a second implementation of caching or provider logic.

## Adapters and types

`Provider` exposes matches(filters), match(id), standings(), and scorers(limit). Components only see Match, TeamRef, StandingRow and ScorerRow. The canonical interfaces are in `netlify/functions/_lib/providers/types.ts`; `src/types/index.ts` re-exports types only, so server code is not bundled into the client.

TeamRef contains an ID, name, short name, monogram and optional crest URL. Match contains a UTC kickoff, normalized status, optional minute and period, stage/matchday, optional venue/referee, two teams, current/half-time/full-time scores, and update timestamp. StandingRow contains rank and league totals. ScorerRow contains player/team, goals, and nullable assists/appearances. A missing field remains null rather than becoming invented data.

The football-data adapter treats fullTime as the current running score while a match is in progress; it does not label that score final. Non-CL single matches are rejected. The alternate adapter maps provider-specific status codes, including extra time, penalties, cancellations and interruptions. The configured season for the alternate is 2026, matching the brief.

## Cache layers

1. Function memory stores normalized data with freshness and discard deadlines. Maps are bounded and concurrent identical requests are coalesced.
2. Host CDN caching shares publicly safe normalized payloads according to response cache directives. Deployment verification must confirm each platform's actual cache behavior.
3. React Query holds the most recent data in page memory. No personal browser storage is used. An error does not discard the last successful payload.

Full-season requests use a separate 30-minute TTL. Short match/detail requests use 25 seconds; standings/scorers use 300. A stale response retains its original update time and carries a stale flag and retry delay. Cache entry age can reach one hour before discard.

## Polling state machine

```text
hidden -> no interval, queries disabled
visible again -> immediately refetch
any IN_PLAY or PAUSED -> 30 seconds
next kickoff > 6 hours -> 15 minutes
otherwise -> 5 minutes
error -> 1, 2, 4, 8 ... 60 seconds, respecting Retry-After
not configured -> 5 minutes, plus a manual retry and demo link
historical demo -> one static request, no provider polling
```

Errors carry consecutive failure count from the client transport. Success clears it. React Query retries are disabled; all scheduled retries pass through the visibility-aware interval. A request already in flight may finish after the page becomes hidden. Returning to visibility enables the stale query and refetches it.

The optimistic clock uses a server minute plus locally elapsed time, clamps at 45/90, and reanchors on successful fetch. PAUSED displays HT, with an extra-time break variant. Without a provider minute or half, kickoff alone cannot distinguish a delayed first half from the second; the display is marked approximate and remains conservatively clamped. Extra time and penalties are explicitly labeled. Demo clocks are frozen.

## Demo provenance

The supplied demo is a historical reconstruction, not a live provider payload captured during play. `scripts/build-historical-demo.mjs` reads archived ESPN scoreboard facts and first-half score breakdowns. It preserves dates, uses monograms, excludes future goals, and includes the source URLs and retrieval date in snapshot.json. The pre-evening table is computed from completed fixtures. Unresolved ties are alphabetical and labeled as such. Assists and appearances remain unknown.

Replacing this with an authentic in-play capture requires a live provider key during a matchday. `scripts/capture-live-demo.mjs` performs that capture through the local proxy and requires at least two live matches. Review its output and provenance before publishing.

## Local serving

Netlify Dev serves the compiled Vite preview on internal port 4179 and functions on public local port 8888. This exercises the production CSP without weakening it for Vite's inline hot-refresh preamble. Rebuild after edits. Plain `npm run dev` is a frontend-only authoring server; it does not run functions. Directly opening index.html displays launch guidance.
