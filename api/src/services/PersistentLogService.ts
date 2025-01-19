import { LogLevel } from '@api/common/enums.ts';
import type { LogData } from '@api/common/types.ts';
import type { Prisma } from '@<organisation-kebab>/prisma/index.ts';
import { SerialisableError } from '@api/common/errors.ts';
import { Inject } from '@resourceful-hono/core';
import { LogService } from '@api/services/LogService.ts';
import { PrismaService } from '@api/services/PrismaService.ts';

export class PersistentLogService extends LogService {
  @Inject()
  declare private readonly prisma: PrismaService;

  public debug(message: string, data: LogData = {}) {
    const { request, payload, tags = [] } = data;
    this.saveLog({
      level: LogLevel.Debug,
      message,
      payload,
      request,
      tags,
    });
  }

  public info(message: string, data: LogData = {}) {
    const { request, payload, tags = [] } = data;
    this.saveLog({
      level: LogLevel.Info,
      message,
      payload,
      request,
      tags,
    });
  }

  public warn(message: string, error?: Error | null, data: LogData = {}) {
    const { request, payload, tags = [] } = data;
    this.saveLog({
      level: LogLevel.Warn,
      message,
      payload,
      request,
      tags,
      error: error && new SerialisableError(error),
    });
  }

  public error(error: Error, data: LogData = {}) {
    const { request, payload, tags = [] } = data;
    this.saveLog({
      level: LogLevel.Error,
      message: error.message,
      payload,
      request,
      tags,
      error: new SerialisableError(error),
    });
  }

  private saveLog(data: Prisma.LogCreateInput) {
    queueMicrotask(async () => {
      await this.prisma.log.create({ data });
    });
  }
}