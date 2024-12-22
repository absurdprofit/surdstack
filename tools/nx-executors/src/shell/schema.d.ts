export interface ShellExecutorSchema {
  command: string;
  cwd?: string;
  env?: { [key: string]: string };
  args?: string[];
}
