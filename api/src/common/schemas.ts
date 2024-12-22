import { z } from 'zod';
import { JwtAlgorithm, JwtType } from '@api/common/enums.ts';
import { DB_ID_LENGTH, RELYING_PARTY_ID } from '@api/common/constants.ts';

export const dbId = z.string().length(DB_ID_LENGTH);

export const jwtHeader = z.object({
  typ: z.nativeEnum(JwtType),
  alg: z.literal(JwtAlgorithm.Es384),
});

export const jwtPayload = z.object({
  iss: z.literal(RELYING_PARTY_ID),
  exp: z.number(),
  aud: z.literal(RELYING_PARTY_ID),
  sub: dbId,
  iat: z.number(),
  jti: dbId,
});
