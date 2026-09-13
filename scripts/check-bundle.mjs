import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );
const key = process.env.FOOTBALL_API_KEY;
for (const file of files('dist').filter((f) =>
  /\.(js|html|css|json|map)$/.test(f),
)) {
  const text = readFileSync(file, 'utf8');
  if (
    (key && text.includes(key)) ||
    /(?:X-Auth-Token|x-apisports-key|VITE_\w*(?:KEY|TOKEN|SECRET))|\b[a-f0-9]{32}\b|\b(?:ghp_|sk_live_)[A-Za-z0-9]{20,}\b/i.test(
      text,
    )
  ) {
    console.error('Secret-shaped content in public output:', file);
    process.exit(1);
  }
}
console.log('Public bundle secret scan passed.');
