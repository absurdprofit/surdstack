import type { NotFoundHandler as HonoNotFoundHandler } from '@hono/hono';
import { NotFoundError } from '@api/common/errors.ts';

export const NotFoundHandler: HonoNotFoundHandler = ({ req }) => {
  throw new NotFoundError('No Resource found at path: ' + req.path);
};