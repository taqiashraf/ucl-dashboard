# Verification record

Verified locally on 13 September 2026 using Node 24 and the installed pinned dependencies.

| Check                              | Result                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| TypeScript strict + Vite build     | Passed                                                                                       |
| Vitest / RTL / MSW                 | 62 tests passed across 7 files                                                               |
| ESLint                             | Passed                                                                                       |
| Prettier                           | Applied; final check included in release checks                                              |
| Public bundle pattern scan         | Passed                                                                                       |
| npm audit, high threshold          | Passed; no vulnerabilities reported after removing unnecessary Vercel helper dependencies    |
| Netlify Dev proxy                  | Verified safe 503 when unconfigured; invalid request/method checks covered by function tests |
| 375px matches + table              | No page-wide overflow; table scroll is internal                                              |
| 768px and 1440px                   | No page-wide overflow                                                                        |
| Keyboard                           | Arrow tabs, Home, match open, Escape close, focus return verified in browser                 |
| Themes                             | Light and dark inspected                                                                     |
| Reduced motion                     | CSS media rule disables pulse and flash; score effect checks media preference                |
| Accessibility structure            | Named live region, semantic table/caption/headers and native modal inspected                 |
| Historical demo                    | 36 matches, 36 clubs, 20 scorers, 7 reconstructed PAUSED matches; provenance included        |
| Screenshots                        | Desktop, tablet, mobile, 1200×630 social image and short replay GIF saved                    |
| Public deployment                  | Not performed: no hosting account supplied                                                   |
| Genuine provider-key integration   | Not performed: no key supplied                                                               |
| Exact production credential search | Pending first keyed deployment; no real credential was available locally                     |
| GitHub Actions run                 | Pending GitHub account/repository; workflow supplied                                         |
| Lighthouse                         | Not measured: headless Chrome exited with status 134 and Lighthouse could not connect        |
| Screen-reader listening pass       | Not performed; accessibility-tree inspection is not a substitute                             |

## Review interface states

While the server is running:

- Normal historical replay: `/?demo=1`
- Loading: `/?demo=1&state=loading`
- Empty match window: `/?demo=1&state=empty`
- Feed failure: `/?demo=1&state=error`
- Stale payload: `/?demo=1&state=stale`
- Missing runtime credential: `/` without a configured key

Review overrides are allowed only in demo mode and show an explicit review banner. They never affect live provider queries. Tests also exercise actual MSW network failure/retry and real handler stale-cache behavior.

## Acceptance items still blocked

The original brief cannot be fully accepted until a public HTTPS deployment is reachable, a real provider key has been exercised, an authentic live snapshot is captured during play if required, production headers/cache/credential absence are verified, remote CI runs, a screen reader is checked, and Lighthouse scores are measured. No successful result is claimed for those items.

The historical reconstruction is a deliberate, labeled fallback to the unavailable live snapshot. Contract tests use explicit synthetic fixtures; they are not presented as captured provider responses. Account setup and deployment instructions are in START-HERE.md and README.md.

History verification: static archives contain 18 current-season and 189 prior-season completed matches; tests cover season switching, result pagination and the final shootout. Missing credentials show Setup required. Gitleaks scanned the initial two commits with no leaks.

BI checks: connected dataset loaded 144 matches (18 completed, 126 scheduled); assist coverage 2/20 at test time. Browser verified Arsenal scope (1 completed, 7 scheduled), CPM change from 12 to 20 ($6,000 to $10,000), and no page-wide overflow at effective 411px and 1170px widths. Tests cover rate denominators, missing scores, club filtering, zero-fee scenarios and spreadsheet formula escaping.

Expanded release: 1,015 completed matches across 2019/20–2026/27 (119, 125, 125, 125, 125, 189, 189, 18). Tests cover old-format groups, two-leg ties, 2020 single-leg quarterfinals, season rollover, kickoff polling and capped partner fulfillment. SQL reconciliation passed. Browser verified eight season choices, historical bracket and synthetic partner filter (Northstar: 79.2%, two shortfalls). Archive refresh workflow is prepared, not active until GitHub/Netlify setup.
