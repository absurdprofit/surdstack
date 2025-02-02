import { createAccessTokenRequest } from '@<organisation-kebab>/schema';
import { FromBody, Result } from '@resourceful-hono/core';
import { NotImplementedError } from '@api/common/errors.ts';
import { type RefreshTokenPayload } from '@api/common/types.ts';
import { HttpStatusCodes, Permissions } from '@api/common/enums.ts';
import type { z } from 'zod';
import AuthResource from '@api/resources/v1/auth/AuthResource.ts';


export default class TokenResource extends AuthResource {
  public async POST(@FromBody(createAccessTokenRequest) tokenRequest: z.infer<typeof createAccessTokenRequest>) {
    switch (tokenRequest.grant_type) {
      case 'authn_token': {
        const { sub: subject, jti: tokenCredentialId } = await this.oAuth.verifyToken(tokenRequest.authn_token);
        const scope = tokenRequest.scope?.split(' ') ?? [Permissions.UserRead, Permissions.UserWrite];
        const accessTokenResponse = await this.oAuth.generateAccessToken(subject, tokenCredentialId, scope);
        return Result(HttpStatusCodes.Ok, accessTokenResponse);
      }
      case 'refresh_token': {
        const { sub: subject, jti: tokenCredentialId, scp: originalScope } = await this.oAuth.verifyToken(tokenRequest.refresh_token) as RefreshTokenPayload;
        let scope = tokenRequest.scope?.split(' ') ?? originalScope;
        scope = scope.filter(scope => originalScope.includes(scope));
        const accessTokenResponse = await this.oAuth.generateAccessToken(subject, tokenCredentialId, scope);
        return Result(HttpStatusCodes.Ok, accessTokenResponse);
      }
      case 'client_credentials': {
        const { subject, tokenCredentialId } = await this.oAuth.verifyClientCredentials(tokenRequest.client_id, tokenRequest.client_secret);
        const scope = tokenRequest.scope?.split(' ') ?? [];
        const accessTokenResponse = await this.oAuth.generateAccessToken(subject, tokenCredentialId, scope);
        return Result(HttpStatusCodes.Ok, accessTokenResponse);
      }
      default: {
        throw new NotImplementedError('Unsupported grant type');
      }
    }
  }
}