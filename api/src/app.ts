import { AppServer } from 'jsr:@resourceful-hono/core@0.1.1';
import { LogService } from '@api/services/LogService.ts';
import { TransientLogService } from '@api/services/TransientLogService.ts';
import { PersistentLogService } from '@api/services/PersistentLogService.ts';
import { OAuthService } from '@api/services/OAuthService.ts';
import { WebAuthnService } from '@api/services/WebAuthnService.ts';
import { ErrorHandler, NotFoundHandler, RequestLogger, ResponseTime } from '@api/middleware/index.ts';
import { PrismaService } from '@api/services/PrismaService.ts';
import { EmailService } from '@api/services/EmailService.ts';
import { UaParserService } from '@api/services/UaParserService.ts';
import { EnvironmentService } from '@api/services/EnvironmentService.ts';

const appServer = AppServer.instance;

const envService = new EnvironmentService();
AppServer.instance.services
  .set(PrismaService, new PrismaService(envService.get('DATABASE_URL'), envService.get('ENVIRONMENT')))
  .set(EnvironmentService, envService)
  .set(OAuthService, new OAuthService())
  .set(WebAuthnService, new WebAuthnService())
  .set(EmailService, new EmailService())
  .set(UaParserService, new UaParserService());

if (envService.get('ENVIRONMENT') === 'production') {
  AppServer.instance.services.set(LogService, new PersistentLogService());
} else {
  AppServer.instance.services.set(LogService, new TransientLogService());
}
  
// Register middleware
AppServer.instance.registerMiddleware([
  RequestLogger,
  ResponseTime,
]);

// Register resources
await AppServer.instance.registerResources('./src/resources/**/*.ts');

AppServer.instance.app.notFound(NotFoundHandler);
AppServer.instance.registerErrorHandler(ErrorHandler);

export default {
  fetch: appServer.app.fetch,
};