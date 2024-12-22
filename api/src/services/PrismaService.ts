import { PrismaClient } from '@<organisation-kebab>/prisma/index.ts';
import { PermissionDescriptions, Permissions } from '@api/common/enums.ts';
import { hash } from '@api/common/utils.ts';
import type { EnvironmentService } from '@api/services/EnvironmentService.ts';

class Seeder<T = void> {
  private readonly seed: Promise<T>;

  constructor(seed = Promise.resolve() as Promise<T>) {
    this.seed = seed;
  }

  public with<U>(callback: (previousResult: T) => Promise<U>): Seeder<U> {
    return new Seeder(this.seed.then(callback));
  }
}

export class PrismaService extends PrismaClient {
  constructor(url: string, environment: EnvironmentService['variables']['ENVIRONMENT']) {
    super({
      datasources: {
        db: {
          url,
        },
      },
    });

    const seed = this.seed()
      .with(() => {
        const permissions = Object.values(Permissions)
          .map((permission) => {
            const [resource, action] = permission.split(':');
            const description = PermissionDescriptions[permission];
            return {
              resource,
              action,
              description,
            };
          })
          .map(({ description, ...resource_action }) => {
            return this.permission.upsert({
              create: { description, ...resource_action },
              update: {
                description,
              },
              where: {
                resource_action,
              },
            });
          });
        return Promise.all(permissions);
      });

    // Development seeding
    if (environment !== 'production') {
      seed.with(async (permissions) => {
        return {
          permissions,
          organisation: await this.organisation.upsert({
            create: {
              name: 'TestOrg',
            },
            update: {},
            where: {
              name: 'TestOrg',
            },
          }),
        };
      })
        .with(async ({ permissions, organisation }) => {
          const email = 'test-user@test.org';
          const clientName = 'm2m';
          const organisationId = organisation.id;
          const privileges = permissions.map(({ resource, action }) => `${resource}:${action}`);
          return {
            user: await this.user.upsert({
              create: {
                displayName: 'TestUser',
                name: 'Test User',
                email,
                organisationId,
              },
              update: {
                privileges,
              },
              where: {
                email_organisationId: {
                  organisationId,
                  email,
                },
              },
            }),
            client: await this.client.upsert({
              create: {
                name: clientName,
                organisationId,
                description: 'A test m2m client.',
                privileges,
              },
              update: {
                privileges,
              },
              where: {
                name_organisationId: {
                  name: clientName,
                  organisationId,
                },
              },
            }),
          };
        })
        .with(async ({ client }) => {
          const clientId = client.id;
          const currentDate = new Date();
          const expires = new Date(currentDate);
          expires.setFullYear(currentDate.getFullYear() + 1); // eslint-disable-line no-magic-numbers
          return this.clientCredential.upsert({
            create: {
              clientSecret: await hash('secret'),
              lastUsed: new Date(),
              trusted: true,
              expires,
              lastUsedIP: '',
              clientId,
            },
            update: {
              expires,
            },
            where: {
              clientId,
            },
          });
        })
        .with((clientCredential) => {
          return this.tokenCredential.upsert({
            create: {
              publicKey: '',
              clientCredential: {
                connect: clientCredential,
              },
            },
            update: {},
            where: {
              sourceId_sourceType: {
                sourceId: clientCredential.id,
                sourceType: clientCredential.type,
              },
            },
          });
        });
    }
  }

  private seed() {
    return new Seeder();
  }
}