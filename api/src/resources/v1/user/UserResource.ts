import { createUserRequest } from '@<organisation-kebab>/schema';
import { Result, FromBody, FromRoute } from '@resourceful-hono/core';
import { BadRequestError, ConflictError, NotFoundError } from '@api/common/errors.ts';
import BaseResource from '../BaseResource.ts';
import type { Prisma } from '@<organisation-kebab>/prisma/index.ts';
import { HttpStatusCodes, Permissions } from '@api/common/enums.ts';
import { z } from 'zod';
import { dbId } from '@api/common/schemas.ts';
import { Protected } from '@api/common/decorators.ts';

export default class UserResource extends BaseResource {
  public async GET(@FromRoute('id', dbId) id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) {
      return Result(HttpStatusCodes.Ok, user);
    } else {
      throw new NotFoundError('User not found');
    }
  }

  @Protected([Permissions.UserWrite, Permissions.UserAdmin])
  public async POST(@FromBody(createUserRequest) request: z.infer<typeof createUserRequest>) {
    // check if user exists
    if (await this.userExists(request.email, request.organisationId))
      throw new ConflictError('User already exists');
    const user = await this.createUser(request);
    if (user) {
      return Result(HttpStatusCodes.Created, user);
    }
  }

  @Protected([Permissions.UserDelete, Permissions.UserAdmin])
  public async DELETE(@FromRoute('id', z.string()) id: string) {
    if (!id) throw new BadRequestError('ID is required');
    const user = await this.deleteUser(id);
    if (user) {
      return Result(HttpStatusCodes.Ok, user);
    }
  }

  private async userExists(email: string, organisationId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email_organisationId: {
          email,
          organisationId,
        },
      },
    });
    if (user) return true;
    return false;
  }

  private async createUser(user: Prisma.UserCreateInput) {
    return await this.prisma.user.create({ data: user });
  }

  private async deleteUser(id: string) {
    return await this.prisma.user.delete({ where: { id } });
  }
}
