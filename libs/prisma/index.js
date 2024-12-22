import { createRequire } from 'node:module';

// necessary for Deno commonjs interop
const require = createRequire(import.meta.url);
// add exports here as necessary
export const { PrismaClient, Prisma } = require('./.generated/index.js');