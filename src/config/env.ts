import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  MUIRAKITAN_WEBHOOK_SECRET: z.string().min(16),
  INGESTION_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
});

export const getEnv = () => envSchema.parse(process.env);
