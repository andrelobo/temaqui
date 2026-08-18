import { getEnv } from '@/config/env';
import { createMongooseIngestionDependencies } from '@/modules/ingestion/mongoose-ingestion.dependencies';
import { createWhatsappWebhookHandler } from '@/modules/ingestion/whatsapp-webhook.handler';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  return createWhatsappWebhookHandler({
    secret: env.MUIRAKITAN_WEBHOOK_SECRET,
    ingestion: createMongooseIngestionDependencies(env.INGESTION_RETENTION_DAYS),
  })(request);
}
