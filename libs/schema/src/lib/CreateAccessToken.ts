import { z } from 'zod';
import { encodedJwt } from './common/schemas.ts';

export enum GrantType {
  AuthnToken = 'authn_token',
  ClientCredentials = 'client_credentials',
  RefreshToken = 'refresh_token'
}
export const grantType = z.nativeEnum(GrantType);

export const usingAuthnTokenRequest = z.object({
  grant_type: z.literal(GrantType.AuthnToken),
  authn_token: z.string(),
  scope: z.string().optional(),
});

export const usingClientCredentialsRequest = z.object({
  grant_type: z.literal(GrantType.ClientCredentials),
  client_id: z.string(),
  client_secret: z.string(),
  scope: z.string().optional(),
});

export const usingRefreshTokenRequest = z.object({
  grant_type: z.literal(GrantType.RefreshToken),
  refresh_token: encodedJwt,
  scope: z.string().optional(),
});

export const createAccessTokenRequest = z.union([
  usingAuthnTokenRequest,
  usingClientCredentialsRequest,
  usingRefreshTokenRequest,
]);

export const createAccessTokenResponse = z.object({
  access_token: encodedJwt,
  refresh_token: encodedJwt.optional(),
  expires: z.number(),
  scope: z.string(),
});
