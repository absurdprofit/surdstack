import type { Prisma } from '@<organisation-kebab>/prisma/index.ts';
import * as jwt from '@wok/djwt';
import { jwtHeader, jwtPayload } from '@api/common/schemas.ts';
import { z } from 'zod';

export interface TokenHeader extends jwt.Header {
  alg: 'ES384';
}
export interface AuthnTokenHeader extends TokenHeader {
  typ: 'authn_token';
}
export interface AccessTokenHeader extends TokenHeader {
  typ: 'access_token';
}
export interface RefreshTokenHeader extends TokenHeader {
  typ: 'refresh_token';
}
export interface TokenPayload extends jwt.Payload {
  iss: string;
  exp: number;
  aud: string;
  sub: string;
  iat: number;
  jti: string;
}
export interface RefreshTokenPayload extends TokenPayload {
  scp: string[];
}
export interface AccessTokenPayload extends TokenPayload {
  scp: string[];
}
export function tokenHasScopeClaim(payload: TokenPayload): payload is AccessTokenPayload | RefreshTokenPayload {
  return z.object({ scp: z.array(z.string()) }).safeParse(payload).success;
}
export function isTokenPayload(payload: unknown): payload is TokenPayload {
  return jwtPayload.safeParse(payload).success;
}
export function isTokenHeader(header: unknown): header is AuthnTokenHeader {
  return jwtHeader.safeParse(header).success;
}
export interface ProtectedOptions {
  roles?: string[];
  permissions?: string[];
  scopes?: string[];
}
export interface HttpRequestLog {
  traceId: string;
  method: string;
  statusCode: number;
  url: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  responseTimeMs: number;
}
export interface LogData {
  payload?: Prisma.InputJsonValue;
  request?: HttpRequestLog;
  tags?: string[];
}
