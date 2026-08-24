import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getEnv } from '@/config/env';
import { SourceModel } from '@/modules/sources/source.model';
import { connectMongo } from '@/shared/db/mongoose';
import { signWebhookBody } from '@/shared/security/hmac';
import { IngestionEventModel } from './ingestion-event.model';
import { createMongooseIngestionDependencies } from './mongoose-ingestion.dependencies';
import { createWhatsappWebhookHandler } from './whatsapp-webhook.handler';

const fixtureChatId = '999999999999999999@g.us';
const externalEventId = `integration-${randomUUID()}`;

describe('WhatsApp webhook with MongoDB Atlas', () => {
  let sourceId: string | undefined;

  beforeAll(async () => {
    await connectMongo();
    await Promise.all([SourceModel.createIndexes(), IngestionEventModel.createIndexes()]);
    await SourceModel.deleteMany({
      type: 'WHATSAPP_GROUP',
      externalId: fixtureChatId,
    }).exec();
    const source = await SourceModel.create({
      type: 'WHATSAPP_GROUP',
      externalId: fixtureChatId,
      active: true,
    });
    sourceId = String(source._id);
  });

  afterAll(async () => {
    await IngestionEventModel.deleteMany({
      provider: 'MUIRAKITAN_WHATSAPP',
      externalEventId,
    }).exec();
    if (sourceId) {
      await SourceModel.deleteOne({ _id: sourceId }).exec();
    }
    await mongoose.disconnect();
  });

  it('persists one event and treats a retry as a successful duplicate', async () => {
    const env = getEnv();
    const rawBody = JSON.stringify({
      id: externalEventId,
      type: 'message.upsert',
      sessionId: 'integration-session',
      payload: {
        chatId: fixtureChatId,
        chatType: 'GROUP',
        senderId: 'not-persisted@s.whatsapp.net',
        fromMe: true,
        body: 'Mensagem técnica do teste de integração',
        timestamp: 1_700_000_001,
        messageType: 'conversation',
      },
      timestamp: '2026-08-18T12:00:00.000Z',
    });
    const signature = signWebhookBody(rawBody, env.MUIRAKITAN_WEBHOOK_SECRET);
    const handler = createWhatsappWebhookHandler({
      secret: env.MUIRAKITAN_WEBHOOK_SECRET,
      ingestion: createMongooseIngestionDependencies(env.INGESTION_RETENTION_DAYS),
    });
    const request = () =>
      new Request('http://localhost/api/internal/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-muirakitan-signature': signature,
        },
        body: rawBody,
      });

    const firstResponse = await handler(request());
    const retryResponse = await handler(request());

    expect(firstResponse.status).toBe(200);
    expect(await firstResponse.json()).toMatchObject({ outcome: 'persisted' });
    expect(retryResponse.status).toBe(200);
    expect(await retryResponse.json()).toMatchObject({ outcome: 'duplicate' });

    const storedEvents = await IngestionEventModel.find({
      provider: 'MUIRAKITAN_WHATSAPP',
      externalEventId,
    })
      .lean()
      .exec();
    expect(storedEvents).toHaveLength(1);
    expect(String(storedEvents[0].sourceId)).toBe(sourceId);
    expect(storedEvents[0]).toMatchObject({
      sessionId: 'integration-session',
      fromMe: true,
      processingStatus: 'CLASSIFIED',
      economicIntent: 'IRRELEVANT',
      classificationMethod: 'RULES_V1',
      classificationSignals: [],
      bodyRetained: true,
      redactionTypes: [],
    });
    expect(storedEvents[0]).not.toHaveProperty('senderId');
  });
});
