import { z } from 'zod';
import { dbId } from './common/schemas.ts';

export const createUserRequest = z.object({
  email: z.string(),
  name: z.string(),
  displayName: z.string(),
  organisationId: dbId,
});
