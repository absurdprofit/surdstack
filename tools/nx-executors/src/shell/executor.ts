import { PromiseExecutor, logger, workspaceRoot } from '@nx/devkit';
import { ShellExecutorSchema } from './schema';
import { spawn, ChildProcess } from 'child_process';
import treeKill from 'tree-kill';
import * as path from 'path';

function parseCommand(command: string, args: string[] = []): [string, string[]] {
  const parts = command.split(' ').concat(args);
  return [parts[0], parts.slice(1)];
}

const runExecutor: PromiseExecutor<ShellExecutorSchema> = async (options) => {
  const {
    command,
    cwd = process.cwd(),
    env = {},
    args = [],
  } = options;
  
  const resolvedCwd = path.resolve(workspaceRoot, cwd);
  logger.info(`Executing command: ${command}`);
  logger.info(`Working directory: ${resolvedCwd}`);
  
  return new Promise((resolve, reject) => {
    const [cmd, defaultArgs] = parseCommand(command, args);
    const child: ChildProcess = spawn(cmd, defaultArgs, {
      shell: true,
      cwd: resolvedCwd,
      env: { ...process.env, ...env },
      stdio: 'pipe',
      killSignal: 'SIGTERM',
    });

    const cleanup = (signal: NodeJS.Signals): void => {
      console.log(`Received ${signal}. Stopping process...`);
      treeKill(child.pid, signal, (err) => {
        if (err) {
          console.error('Error killing process tree:', err);
        }
        process.exit(0);
      });
    };

    process.on('SIGINT', () => cleanup('SIGINT'));
    process.on('SIGTERM', () => cleanup('SIGTERM'));

    child.stdout?.on('data', (data) => {
      logger.log(data.toString().trim());
    });
    child.stderr.on('data', (data) => {
      logger.error(data.toString().trim());
    });
    child.on('exit', (code: number | null) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    child.on('error', (err: Error) => {
      reject(new Error(`Failed to start process: ${err.message}`));
    });
  });
};

export default runExecutor;
