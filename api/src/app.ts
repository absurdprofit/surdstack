import { Application } from '@resourceful-hono/core';
import { LogService } from '@api/services/LogService.ts';
import { TransientLogService } from '@api/services/TransientLogService.ts';
import { PersistentLogService } from '@api/services/PersistentLogService.ts';
import { OAuthService } from '@api/services/OAuthService.ts';
import { WebAuthnService } from '@api/services/WebAuthnService.ts';
import { RequestLogger, ResponseTime } from '@api/middleware/index.ts';
import { PrismaService } from '@api/services/PrismaService.ts';
import { EmailService } from '@api/services/EmailService.ts';
import { UaParserService } from '@api/services/UaParserService.ts';
import { EnvironmentService } from '@api/services/EnvironmentService.ts';
import UserResource from '@api/resources/v1/user/UserResource.ts';
import TokenResource from '@api/resources/v1/auth/token/TokenResource.ts';
import AssertionResource from '@api/resources/v1/auth/assertion/AssertionResource.ts';
import AttestationResource from '@api/resources/v1/auth/attestation/AttestationResource.ts';
import { cors } from '@hono/hono/cors';

const application = Application.instance;

const envService = new EnvironmentService();
Application.instance.registerService(PrismaService, new PrismaService(envService.get('DATABASE_URL'), envService.get('ENVIRONMENT')));
Application.instance.registerService(EnvironmentService, envService);
Application.instance.registerService(OAuthService, new OAuthService());
Application.instance.registerService(WebAuthnService, new WebAuthnService());
Application.instance.registerService(EmailService, new EmailService());
Application.instance.registerService(UaParserService, new UaParserService());

if (envService.get('ENVIRONMENT') === 'production') {
  Application.instance.registerService(LogService, new PersistentLogService());
} else {
  Application.instance.registerService(LogService, new TransientLogService());
}
  
// Register middleware
Application.instance.registerMiddlewares([
  RequestLogger,
  ResponseTime,
  cors({
    origin: 'http://localhost:4200'
  })
]);

// Register resources
await Application.instance.registerResources([UserResource, TokenResource, AssertionResource, AttestationResource]);

export default {
  fetch: application.fetch,
};