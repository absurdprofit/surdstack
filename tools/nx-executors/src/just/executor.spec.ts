import { ExecutorContext } from '@nx/devkit';

import { JustExecutorSchema } from './schema';
import executor from './executor';

const options: JustExecutorSchema = {};
const context: ExecutorContext = {
  root: '',
  cwd: process.cwd(),
  isVerbose: false,
};

describe('Just Executor', () => {
  it('can run', async () => {
    const output = await executor(options, context);
    expect(output.success).toBe(true);
  });
});
