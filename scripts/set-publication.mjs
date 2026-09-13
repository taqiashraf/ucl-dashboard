import { readFileSync, writeFileSync } from 'node:fs';
const [site, repo] = process.argv.slice(2);
const url = new URL(site);
if (
  url.protocol !== 'https:' ||
  url.pathname !== '/' ||
  url.search ||
  url.hash ||
  url.username ||
  url.password
)
  throw new Error('Supply an HTTPS origin with no path, query, or credentials');
if (!/^[\w.-]+\/[\w.-]+$/.test(repo))
  throw new Error('Supply the GitHub owner/repository');
let readme = readFileSync('README.md', 'utf8');
readme = readme.replace(
  '[![Local demo](docs/preview-badge.svg)](http://localhost:8888/?demo=1)',
  `[![Open dashboard](https://img.shields.io/badge/Open-dashboard-1E4FD8?style=for-the-badge)](${url.origin})\n[![CI](https://github.com/${repo}/actions/workflows/ci.yml/badge.svg)](https://github.com/${repo}/actions/workflows/ci.yml)`,
);
readme = readme.replace(
  '**Public deployment is pending account setup.** No public URL or successful GitHub Actions run is claimed.',
  `**Public dashboard:** [${url.hostname}](${url.origin}). Check the CI badge for the current workflow status.`,
);
readme = readme.replaceAll(
  'http://localhost:8888/?demo=1',
  `${url.origin}/?demo=1`,
);
writeFileSync('README.md', readme);
const html = readFileSync('index.html', 'utf8').replace(
  /(<meta\s+property="og:image"\s+content=")[^"]+("\s*\/?>)/,
  `$1${url.origin}/og-image.png$2`,
);
writeFileSync('index.html', html);
console.log(
  'Updated README links, CI badge and absolute social image URL. Set the GitHub About website field to the same origin.',
);
