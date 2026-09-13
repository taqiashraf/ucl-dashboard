import type { Context } from '@netlify/functions';
import { handleRequest } from './_lib/handler';
export default (request: Request, context: Context) =>
  handleRequest(request, context.ip);
