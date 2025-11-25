import { JustExecutorSchema } from './schema';

type ArgBuilder<T> = (value: T) => string[];

const handlers: {
  [K in keyof JustExecutorSchema]?: ArgBuilder<JustExecutorSchema[K]>
} = {
  noWorkingDirectory: (v: boolean) => v ? ['--no-working-directory'] : [],
  dotenvOverride: (v: boolean) => v ? ['--dotenv-override'] : [],
  noDotenv: (v: boolean) => v ? ['--no-dotenv'] : [],
  dryRun: (v: boolean) => v ? ['--dry-run'] : [],
  choose: (v: boolean) => v ? ['--choose'] : [],
  check: (v: boolean) => v ? ['--check'] : [],
  unsorted: (v: boolean) => v ? ['--unsorted'] : [],
  summary: (v: boolean) => v ? ['--summary'] : [],
  quiet: (v: boolean) => v ? ['--quiet'] : [],
  verbose: (v: boolean) => v ? ['--verbose'] : [],

  justfile: (v: string) => ['--justfile', v],
  workingDirectory: (v: string) => ['--working-directory', v],
  dotenvFilename: (v: string) => ['--dotenv-filename', v],
  dotenvPath: (v: string) => ['--dotenv-path', v],
  color: (v: 'auto' | 'always' | 'never') => ['--color', v],

  jobs: (v: number) => ['--jobs', String(v)],

  set: (obj: Record<string, string>) =>
    Object.entries(obj).flatMap(([k, v]) => ['--set', `${k}=${v}`]),

  setOverride: (obj: Record<string, string>) =>
    Object.entries(obj).flatMap(([k, v]) => ['--set-override', `${k}=${v}`]),

  // tasks and args must be handled separately in final assembly
};

export function schemaToArgv(options: JustExecutorSchema): string[] {
  const argv: string[] = [];

  for (const [key, handler] of Object.entries(handlers)) {
    if (options[key] == null || options[key] === undefined) continue;

    const value = options[key];
    argv.push(...handler(value as never));
  }

  // Insert tasks
  argv.push(...options.tasks);

  // Insert extra args
  if (options.args) {
    argv.push(...options.args);
  }

  return argv;
}
