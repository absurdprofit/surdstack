import { z } from 'zod';

export class EnvironmentService {
  #schema = z.object({
    DATABASE_URL: z.string().startsWith('mongodb://'),
    ENVIRONMENT: z.union([
      z.literal('production'),
      z.literal('development'),
    ]),
    RESEND_API_KEY: z.string(),
  });

  private readonly variables;

  constructor() {
    const result = this.#schema.safeParse(Deno.env.toObject());
    if (result.success) {
      this.variables = result.data;
    } else {
      const formatted = result.error.format();
      const reformatted = Object.entries(formatted).reduce((previous, [key, value]) => {
        if (Array.isArray(value))
          return previous;
        previous[key] = value._errors;
        return previous;
      }, {} as Record<string, string[]>);
      throw new Error('Environment misconfiguration detected.', { cause: reformatted });
    }
  }

  public get<K extends keyof EnvironmentService['variables']>(key: K): EnvironmentService['variables'][K] {
    return this.variables[key];
  }
}