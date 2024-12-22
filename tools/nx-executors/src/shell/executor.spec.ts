import { ExecutorContext } from '@nx/devkit';

import { ShellExecutorSchema } from './schema';
import executor from './executor';

let capturedOutput = "";
// Override process.stdout.write to capture output
const stdoutWrite = process.stdout.write;
const customStdoutWrite = (chunk) => {
  capturedOutput += chunk;  // Add output to the capturedOutput variable
  return true;
};

const EXPECTED_STDOUT_SUBSTR = 'Hello development';
let ENV_VARIABLE_TEMPLATE;
if (process.platform === 'win32')
  ENV_VARIABLE_TEMPLATE = '%ENV%';
else
  ENV_VARIABLE_TEMPLATE = '$ENV';

const options: ShellExecutorSchema = {
  command: 'echo',
  args: ['Hello', ENV_VARIABLE_TEMPLATE],
  env: {
    ENV: 'development'
  },
  cwd: '.'
};
const context: ExecutorContext = {
  root: '',
  cwd: process.cwd(),
  isVerbose: false,
};

describe('Shell Executor', () => {
  it('can run', async () => {
    process.stdout.write = customStdoutWrite;
    const output = await executor(options, context);
    process.stdout.write = stdoutWrite;
    expect(output.success).toBe(true);
    expect(capturedOutput.includes(EXPECTED_STDOUT_SUBSTR)).toBe(true);  
  });
});
