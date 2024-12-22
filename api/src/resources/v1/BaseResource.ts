import { Route, Resource, Inject } from '@api/internals/index.ts';
import { PrismaService } from '@api/services/PrismaService.ts';

@Route('/api/v1/')
export default abstract class BaseResource extends Resource {
  @Inject()
  declare protected readonly prisma: PrismaService;
}