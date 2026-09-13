# Security

## Threat model and scope

The realistic threats are API credential theft, abuse of a shared request quota, unexpected upstream input, and third-party dependency vulnerabilities. A server-side proxy keeps the credential out of public JavaScript. A fixed route allowlist, caching, throttling and backoff reduce quota abuse.

This is not a claim of absolute invulnerability. Memory-based throttles operate per warm function instance, reset on cold starts, and do not coordinate across instances or regions. CORS cannot stop scripts, bots, or forged Origin headers outside browsers. A distributed attacker can still consume quota. High-traffic deployment needs platform edge limits or a shared quota service; this database-free project does not pretend otherwise.

## Credential boundary

Only serverless modules read `FOOTBALL_API_KEY`. Both hosts use the same handler. The client calls same-origin `/api/cl/*` without credentials. Vite replaces `VITE_` variables in browser bundles, so `.env` is not a client-side secret store. Secrets must never use that prefix.

`.env`, `.env.local` and `.env.*.local` are ignored. `.env.example` contains names and an empty key. `scripts/check-bundle.mjs` rejects credential header names, secret-variable patterns, provider-shaped 32-character hex tokens and the exact key when available in its environment. Pattern scanning has false-negative and false-positive limits. Runtime-only production keys need the additional operator-controlled exact-string bundle check after deployment.

## Request and response boundary

- Only GET is accepted; other methods receive 405 with Allow: GET.
- Routes are matches, standings, scorers and match/positive-integer. No arbitrary URL, hostname or path is accepted. Single-match adapters also verify Champions League membership.
- Zod rejects unknown or duplicate parameters, invalid calendar dates, dates outside 400 days, reversed or oversized date windows, invalid season values, and limits outside 1–50. Date windows are limited to 31 days. Season and date filters cannot be combined.
- Provider hosts and authentication header names are constants. Requests use a 10-second timeout and reject redirects.
- Adapters validate upstream JSON and project it into explicit UI fields. Account metadata and upstream headers are never forwarded. Crest URLs accept HTTPS on two specified provider CDNs only.
- Errors return generic codes, never upstream bodies. Logs contain only a numeric upstream status; the redaction helper strips known key values and named credential headers. No raw headers, request configuration or environment object is logged.
- An Origin header, when present, must equal `ALLOWED_ORIGIN`. The response permits that origin only and varies by Origin. Requests without Origin are permitted for same-origin navigation, server clients and monitoring. This is browser isolation, not authentication.

## Cache, quota and availability

Function memory caches matches/details for 25 seconds, standings/scorers for five minutes, and explicit full-season fixtures for 30 minutes. A bounded cache retains expired results for up to one hour for fallback. CDN responses specify public `s-maxage` and `stale-while-revalidate=60`; stale results are marked and retain their original timestamp. Error responses use no-store.

Concurrent identical requests share one provider promise. Each warm instance limits visitors to a 30-token bucket replenished at 30/minute. A second eight-token provider bucket reduces upstream bursts. A 429 starts a cooldown using Retry-After and exponential backoff; the function never retries in a hot loop. Neither bucket is a distributed guarantee. API-Football's daily limit is not enforced globally by this implementation.

IP addresses are transiently processed to enforce the throttle. Only a salted HMAC index is held in memory, with short expiry; it is not logged or persisted. Calling this “no visitor data ever processed” would be inaccurate. The app has no accounts, forms, analytics, trackers, cookies, personal localStorage or visitor database. Hosting/CDN operators and optional remote crest servers can process ordinary request metadata under their own policies. The design removes application-level stored visitor records rather than promising that infrastructure handles no metadata.

## Browser and dependency controls

Both host configs set CSP with same-origin scripts, styles, fonts and connections, and only the two provider crest CDNs for images. They deny framing and objects, limit base URLs, and disable form actions. Additional headers are nosniff, strict-origin-when-cross-origin, DENY, and camera/microphone/geolocation restrictions. Fonts are local. Live text and scores use React text rendering, not injected HTML.

Direct dependencies are pinned and the lockfile is committed. CI runs typecheck, ESLint, tests, build, bundle checks, npm audit at high severity, and gitleaks. Dependabot covers npm and GitHub Actions. These tools reduce risk; they do not prove the absence of vulnerabilities.

## If a key leaks

Rotate or revoke it at the provider immediately. Removing a commit or deleting an `.env` file is not enough: the old key remains usable until revoked. Replace the hosting runtime secret, redeploy, check usage, and investigate logs and repository history. Never paste the old or new key into a public issue.

Until a private disclosure address exists, do not publish credential details in GitHub issues. Use the repository owner's private contact channel once the repository is published.
