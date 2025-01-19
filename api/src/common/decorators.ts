import { Application, Headers, type IResource, type RequestMethod } from '@resourceful-hono/core';
import { ForbiddenError, UnauthorizedError } from '@api/common/errors.ts';
import { hasRequiredScope } from '@api/common/utils.ts';
import { OAuthService } from '@api/services/OAuthService.ts';
import { tokenHasScopeClaim } from '@api/common/types.ts';
import { Permissions } from '@api/common/enums.ts';

export function Protected(requiredScope: Permissions[]) {
  function ProtectedFactory<T extends IResource[RequestMethod]>(_target: IResource, _propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: IResource, ...args: unknown[]) {
      const authHeader = this.request.headers.get(Headers.Authorization) ?? 'Bearer ';
      const [scheme, token] = authHeader.split(' ');
      if (scheme !== 'Bearer') throw new UnauthorizedError('Invalid authorization scheme');
      if (!token) throw new UnauthorizedError('No token provided');
      const oAuthService = Application.instance.getService(OAuthService);
      const payload = await oAuthService.verifyToken(token);
      if (tokenHasScopeClaim(payload) && !hasRequiredScope(requiredScope, payload.scp))
        throw new ForbiddenError('Insufficient privileges');
      return originalMethod?.apply(this, args);
    } as T;
  }
  return ProtectedFactory;
}
