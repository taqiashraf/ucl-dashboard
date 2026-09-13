# Run the dashboard

**Open [the historical demo](http://localhost:8888/?demo=1).** This link works on this Mac while the local server is running. It is not a public website link.

The source `index.html` cannot run the app by itself. Use the web address above, not a `file://` address. The dashboard needs a server to load React and its API routes.

## Restart it later

1. Install **Node.js 24 LTS** from [nodejs.org](https://nodejs.org/en/download) if `node --version` and `npm --version` do not work in Terminal. The development session used Codex's bundled Node runtime; that does not install Node into your regular Terminal.
2. Open Terminal and run:

   ```sh
   cd "/Users/taqi/Documents/Codex/2026-09-13/files-mentioned-by-the-user-codex/outputs/ucl-dashboard"
   npm install
   npm run dev:netlify
   ```

3. Open [localhost:8888/?demo=1](http://localhost:8888/?demo=1). Keep that Terminal window open. Press Control-C to stop the server.

No account or API key is needed for the historical demo. It reconstructs half-time scores from 1 October 2024 and is labeled throughout. These are not today's scores.

## Connect current football data

1. Create a [football-data.org account](https://www.football-data.org/client/register) and obtain an API key.
2. In the project directory, run `cp .env.example .env`. Open `.env` in a text editor and fill in `FOOTBALL_API_KEY`. Keep `DATA_PROVIDER=football-data` and `ALLOWED_ORIGIN=http://localhost:8888`.
3. Restart `npm run dev:netlify` and open [live mode](http://localhost:8888/).

Keep the key private. Do not put it into chat, GitHub, or a variable beginning with `VITE_`. The free feed is delayed. Some statistics may require a different provider plan.

## Put it online

1. Create your own [GitHub account](https://github.com/signup) and [Netlify account](https://app.netlify.com/signup). Complete the account and email verification steps yourself.
2. Publish this project folder as a new GitHub repository. GitHub Desktop can add the existing local repository and publish it. Review the files first; `.env` is ignored.
3. In Netlify, import that repository. Use build command `npm run build`, publish directory `dist`, and functions directory `netlify/functions`.
4. In Netlify's environment-variable settings, add the same three variable names. Set the API key there and set `ALLOWED_ORIGIN` to the exact HTTPS address Netlify assigns your site. Include the Functions scope where scope controls are available. Redeploy after changing the values.
5. Open the public URL. Use `?demo=1` for the historical replay. Follow the production verification checklist in [README.md](README.md) before sharing it with recruiters.

Your current project has not been published: no hosting account, GitHub account, or API key was available during the build. Account creation and live deployment remain necessary. GitHub can be skipped for a manual Netlify CLI deployment, but it is needed for the included GitHub Actions workflow and is the recommended portfolio path.

## Browse recent results now

Open http://localhost:8888/?view=history and use the Season selector. The archive contains 18 completed 2026/27 matches and 189 from 2025/26, retrieved on 13 September 2026. It includes league-phase and knockout matches, not qualifying rounds. Penalty and aggregate scores are kept separate from match scores. No API account is needed for this static archive.

The 2024/25 historical demo is a separate frozen replay. The Matchday logo returns to live mode. “Setup required” means the server needs `FOOTBALL_API_KEY` and `ALLOWED_ORIGIN` from `.env.example`; refreshing alone cannot connect it. After adding these privately to `.env`, restart `npm run dev:netlify`. GitHub and Netlify accounts are only needed for the publishing workflow, not local browsing.

To refresh the results archive, run `node scripts/update-history.mjs`, then `npm run build`.
