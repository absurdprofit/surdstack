import type { ErrorHandler as HonoErrorHandler } from '@hono/hono';
import { HttpError, InternalServerError } from '@api/common/errors.ts';
import { ContentTypes, Headers } from '@api/common/enums.ts';

export const ErrorHandler: HonoErrorHandler = (error, context) => {
  if ((error instanceof HttpError) === false) {
    error = new InternalServerError('There was an error. Please contact support@<organisation-kebab>.com.', { cause: error });
    context.error = error;
  }

  context.status((error as HttpError).status);
  const response = context.json({
    type: (error as HttpError).type,
    title: error.name,
    status: (error as HttpError).status,
    detail: error.message,
    trace: context.res.headers.get(Headers.TraceId),
    instance: context.req.path,
    ...(error as HttpError).extensions,
  });
  response.headers.set(Headers.ContentType, ContentTypes.ProblemDetails);
  return Promise.resolve(response);
};