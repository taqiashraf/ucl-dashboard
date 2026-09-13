import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('public shell', () => { it('has a useful title and no client-side secret configuration', () => { const html = readFileSync('index.html', 'utf8'); expect(html).toContain('<title>Champions League Live Dashboard</title>'); expect(html).not.toContain('VITE_FOOTBALL_API_KEY'); }); });
