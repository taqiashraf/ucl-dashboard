import { z } from 'zod';
export type Route =
  | { name: 'matches'; dateFrom?: string; dateTo?: string; season?: number }
  | { name: 'standings' }
  | { name: 'scorers'; limit: number }
  | { name: 'match'; id: number };
const integer = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().safe().positive());
export function validate(url: URL, now = Date.now()): Route {
  const path = url.pathname
    .replace(/^\/(?:api\/cl|\.netlify\/functions\/cl)(?=\/|$)/, '')
    .replace(/^\//, '');
  const params: Record<string, string> = {};
  for (const [key, value] of url.searchParams) {
    if (key in params) throw new Error('Duplicate parameter');
    params[key] = value;
  }
  const date = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => {
      const stamp = Date.parse(v);
      return (
        Number.isFinite(stamp) &&
        new Date(stamp).toISOString().slice(0, 10) === v &&
        Math.abs(stamp - now) <= 400 * 86400000
      );
    });
  if (path === 'matches') {
    const p = z
      .object({
        dateFrom: date.optional(),
        dateTo: date.optional(),
        season: integer
          .pipe(
            z
              .number()
              .min(new Date(now).getUTCFullYear() - 1)
              .max(new Date(now).getUTCFullYear() + 1),
          )
          .optional(),
      })
      .strict()
      .refine(
        (p) =>
          !!p.dateFrom === !!p.dateTo &&
          !(p.season && p.dateFrom) &&
          (!p.dateFrom ||
            (p.dateFrom <= p.dateTo! &&
              Date.parse(p.dateTo!) - Date.parse(p.dateFrom) <= 31 * 86400000)),
      )
      .parse(params);
    return { name: 'matches', ...p };
  }
  if (path === 'standings') {
    z.object({}).strict().parse(params);
    return { name: 'standings' };
  }
  if (path === 'scorers') {
    const p = z
      .object({ limit: integer.pipe(z.number().max(50)).optional() })
      .strict()
      .parse(params);
    return { name: 'scorers', limit: p.limit ?? 20 };
  }
  if (/^match\/[1-9]\d*$/.test(path)) {
    z.object({}).strict().parse(params);
    return { name: 'match', id: integer.parse(path.split('/')[1]) };
  }
  throw new Error('Invalid route');
}
