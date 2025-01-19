import type { MiddlewareHandler } from '@hono/hono';
import { Application } from '@resourceful-hono/core';
import { LogService } from '@api/services/LogService.ts';
import { createHttpRequestLog } from '@api/common/utils.ts';

export const RequestLogger: MiddlewareHandler = async (context, next) => {
  await next();
  const logService = Application.instance.getService(LogService);
  const requestLog = createHttpRequestLog(context.req.raw, context.res);

  if (context.error) {
    logService.error(context.error, { request: requestLog });
  } else {
    logService.info('', { request: requestLog });
  }
};