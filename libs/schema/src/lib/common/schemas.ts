import { DB_ID_LENGTH } from './constants.ts';
import * as z from 'zod';

export const dbId = z.string().length(DB_ID_LENGTH);

export const encodedJwt = z.string().startsWith('ey').includes('.');
