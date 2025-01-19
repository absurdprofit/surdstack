import * as base64url from '@std/encoding/base64url';
import type { HttpRequestLog } from '@api/common/types.ts';
import { CryptoHashingAlgorithm, Headers, Permissions } from '@api/common/enums.ts';
import { EnvironmentService } from '@api/services/EnvironmentService.ts';
import { Application } from '@resourceful-hono/core';

export const textEncoder = new TextEncoder();
export async function hash(message: string) {
  const digest = await crypto.subtle.digest(CryptoHashingAlgorithm.SHA512, textEncoder.encode(message));
  return base64url.encodeBase64Url(digest);
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function filterNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function createHttpRequestLog(req: Request, res: Response): HttpRequestLog {
  const { url, method } = req;
  const { status: statusCode } = res;
  const ip = req.headers.get(Headers.ForwardedFor) ?? '';
  const userAgent = req.headers.get(Headers.UserAgent) ?? '';
  const responseTimeMs = Number(res.headers.get(Headers.ResponseTime));
  const timestamp = res.headers.get(Headers.Timestamp) ?? '';
  return {
    traceId: res.headers.get(Headers.TraceId) ?? '',
    method,
    statusCode,
    url,
    ip,
    userAgent,
    responseTimeMs,
    timestamp,
  };
}

export const getEnv: EnvironmentService['get'] = (key) => {
  return Application.instance.getService(EnvironmentService).get(key);
};

export function hasRequiredScope(requiredScope: Permissions[], scopeClaims: string[]) {
  return requiredScope.some(scope => scopeClaims.includes(scope));
}
