import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleRequest } from '../netlify/functions/_lib/handler';
// Thin Node HTTP bridge; all routing and security remain in the shared handler.
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const url = new URL(req.url ?? '/', 'https://function.internal');
  // Vercel rewrites preserve the original path in a reserved internal parameter.
  const route = url.searchParams.get('__route');
  if (route !== null) {
    url.pathname = '/api/cl/' + route;
    url.searchParams.delete('__route');
  }
  const headers = new Headers();
  if (typeof req.headers.origin === 'string')
    headers.set('origin', req.headers.origin);
  const ip =
    typeof req.headers['x-vercel-forwarded-for'] === 'string'
      ? req.headers['x-vercel-forwarded-for'].split(',')[0].trim()
      : (req.socket.remoteAddress ?? 'unknown');
  const response = await handleRequest(
    new Request(url, { method: req.method, headers }),
    ip,
  );
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(await response.text());
}
