import type { HttpRequestLog, LogData } from '@api/common/types.ts';
import { LogService } from '@api/services/LogService.ts';
import { HttpStatusCodes } from '@api/common/enums.ts';

enum StatusColour {
  REDIRECT = 'rgb(255, 255, 0)',
  ERROR = 'red',
  SUCCESS = 'rgb(0, 255, 25)'
}

export class TransientLogService extends LogService {
  public debug(message: string, data: LogData = {}) {
    const { request, payload } = data;
    if (request) this.printRequestLog(request);
    return console.debug(message, payload ?? '');
  }

  public info(message: string, data: LogData = {}) {
    const { request, payload } = data;
    if (request) this.printRequestLog(request);
    return console.info(message, payload ?? '');
  }

  public warn(message: string, error?: Error | null, data: LogData = {}) {
    const { request, payload } = data;
    if (request) this.printRequestLog(request);
    return console.warn(message, error, payload ?? '');
  }

  public error(error: Error, data: LogData = {}) {
    const { request, payload } = data;
    if (request) this.printRequestLog(request);
    return console.error(error, payload ?? '');
  }

  private printRequestLog({
    method,
    statusCode,
    url,
    ip,
    userAgent,
    responseTimeMs,
  }: HttpRequestLog) {
    const log = `[${method} %c${statusCode}%c] ${url} - ${new Date().toUTCString()} | ${ip} ${userAgent} | ${responseTimeMs}ms\n`;
    let statusColour;
    if (statusCode < HttpStatusCodes.MultipleChoices) {
      statusColour = StatusColour.SUCCESS;
    } else if (statusCode < HttpStatusCodes.BadRequest) {
      statusColour = StatusColour.REDIRECT;
    } else {
      statusColour = StatusColour.ERROR;
    }
    console.log(log, `color: ${statusColour}`, 'color: white');
  }
}