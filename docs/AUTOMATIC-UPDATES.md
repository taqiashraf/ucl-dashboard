# Automatic updates and public deployment

## Connected match data

The open dashboard polls the server automatically. In-play matches and the ten-minute window around kickoff use a 30-second interval; idle pages use slower intervals and hidden tabs pause. The server caches results and enforces an upstream request budget. A free provider plan may delay statuses and scores: polling does not remove that delay.

The red LIVE badge is driven by IN_PLAY or PAUSED status, not the clock. Tests cover the behavior; no genuine in-play match was available during local verification. Do not represent the frozen replay as a live test.

Football-data's default competition endpoints choose the active season; the season heading reads provider season metadata. A July-based date fallback is used before metadata arrives. API-Football's fallback season now rolls forward by date. Future competition format or provider schema changes may still need maintenance.

## Historical archive

`scripts/update-history.mjs` fetches the current and seven prior seasons from ESPN, validates completed scores, filters the source season and excludes qualifying rounds. Its September–August windows preserve the delayed 2019/20 finish. The current season before September is an empty results archive until the main competition starts. The index drives season selectors after rebuild.

`.github/workflows/refresh-history.yml` is prepared to run daily at 06:23 UTC and on manual dispatch. It validates/builds before committing archive changes. This workflow is a repository file, not an active scheduled service until the project is pushed to GitHub and Actions are enabled. GitHub schedules can be delayed and may pause in inactive public repositories; monitor failed runs.

For Netlify:

1. Push the project to the chosen GitHub repository and import it in Netlify. The checked-in configuration uses `npm run build`, publishes `dist`, and deploys `netlify/functions`.
2. Set server environment variables privately: FOOTBALL_API_KEY, DATA_PROVIDER=football-data, ALLOWED_ORIGIN equal to the exact deployed HTTPS origin.
3. Enable the archive workflow on the default branch with permission to commit. Branch protection may require a PR-based update process instead.
4. Create a Netlify build hook and store its URL as the GitHub Actions secret NETLIFY_BUILD_HOOK. The workflow invokes it after validation and committing. Treat the hook URL as a secret.
5. Run the workflow once and verify the archive timestamp and live endpoints on the public site. Confirm deployment behavior before relying on unattended refresh.

No GitHub repository, live build hook or public deployment was configured in this implementation turn. Localhost works only while the local server is running. A deployed Netlify function runs independently of your laptop.

## Commercial measurements

The sample partnership exercise is intentionally synthetic and never refreshed as if it were a real campaign. Real asset reporting needs an authorized source and a stable partner/campaign identifier. Ticket listings, stadium attendance, reach, impressions and revenue are different measures.

Ticketmaster Discovery documents optional event price ranges, but Champions League coverage was not verified. Do not request another key solely on the assumption that it includes the games you need. Start with licensed club/partner exports or official attendance reports where available; preserve source dates and definitions.
