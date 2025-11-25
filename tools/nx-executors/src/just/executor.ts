import { ExecutorContext, logger } from '@nx/devkit';
import { spawn } from 'node:child_process';
import { JustExecutorSchema } from './schema';
import { schemaToArgv } from './argv';
import treeKill from 'tree-kill';
import { SUCCESS_EXIT_CODE } from './constants';

export default async function runExecutor(
  { env = {}, ...options}: JustExecutorSchema,
  context: ExecutorContext
) {
  const projectRoot = context
    .projectsConfigurations
    ?.projects[context.projectName]
    ?.root;
  const cwd = options.workingDirectory ?? projectRoot ?? process.cwd();

  const argv = schemaToArgv(options);

  logger.info(`just ${argv.join(' ')}`);

  return new Promise<{ success: boolean }>((resolve) => {
    const child = spawn('just', argv, {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...env
      }
    });

    const cleanup = (signal: NodeJS.Signals): void => {
      logger.info(`Received ${signal}. Stopping process...`);
      treeKill(child.pid, signal, (err) => {
        if (err) {
          logger.error(`Error killing process tree: ${err.message}`);
        }
        process.exit(SUCCESS_EXIT_CODE);
      });
    };

    process.on('SIGINT', () => cleanup('SIGINT'));
    process.on('SIGTERM', () => cleanup('SIGTERM'));

    child.on('exit', (code) => {
      resolve({ success: code === SUCCESS_EXIT_CODE });
    });

    child.on('error', (err) => {
      logger.error(`Failed to start just: ${err.message}`);
      resolve({ success: false });
    });
  });
}
