import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(4000),
  BODY_LIMIT: z.coerce.number().int().positive().default(12_000_000),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().default('postgresql://civic:civic@localhost:55432/civic_issue'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5175')
});

export const config = envSchema.parse(process.env);
export const isProduction = config.NODE_ENV === 'production';
