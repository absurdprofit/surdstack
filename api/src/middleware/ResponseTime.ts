import type { MiddlewareHandler } from '@hono/hono';
import { Headers } from '@api/common/enums.ts';

export const ResponseTime: MiddlewareHandler = async (context, next) => {
  const start = performance.now();
  context.res.headers.set(Headers.Timestamp, new Date().toISOString());
  await next();
  const end = performance.now();
  context.res.headers.set(Headers.ResponseTime, `${end - start}`);
};