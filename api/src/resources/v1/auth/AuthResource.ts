import BaseResource from '@api/resources/v1/BaseResource.ts';
import { OAuthService } from '@api/services/OAuthService.ts';
import { Inject } from '@resourceful-hono/core';

export default abstract class AuthResource extends BaseResource {
  @Inject()
  declare protected readonly oAuth: OAuthService;
}