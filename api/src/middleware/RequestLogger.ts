import type { MiddlewareHandler } from '@hono/hono';
import { AppServer } from '@api/internals/index.ts';
import { LogService } from '@api/services/LogService.ts';
import { createHttpRequestLog } from '@api/common/utils.ts';

export const RequestLogger: MiddlewareHandler = async (context, next) => {
  await next();
  const logService = AppServer.instance.services.get(LogService);
  const requestLog = createHttpRequestLog(context.req.raw, context.res);

  if (context.error) {
    logService.error(context.error, { request: requestLog });
  } else {
    logService.info('', { request: requestLog });
  }
};