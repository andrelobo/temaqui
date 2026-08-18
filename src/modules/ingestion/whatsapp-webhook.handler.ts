import { gatewayEnvelopeSchema, messageUpsertPayloadSchema } from './gateway-event.schema';
import { ingestMessageUpsert, IngestionDependencies } from './ingestion.service';
import { logEvent } from '@/shared/observability/log';
import { verifyWebhookSignature } from '@/shared/security/hmac';

const MAX_BODY_BYTES = 256 * 1024;

interface HandlerDependencies {
  secret: string;
  ingestion: IngestionDependencies;
}

const jsonResponse = (body: Record<string, unknown>, status = 200): Response =>
  Response.json(body, { status });

export const createWhatsappWebhookHandler =
  (dependencies: HandlerDependencies) =>
  async (request: Request): Promise<Response> => {
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_BODY_BYTES) return jsonResponse({ error: 'payload_too_large' }, 413);

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'payload_too_large' }, 413);
    }

    const signature = request.headers.get('x-muirakitan-signature');
    if (!verifyWebhookSignature(rawBody, signature, dependencies.secret)) {
      logEvent('warn', 'whatsapp_ingestion.invalid_signature');
      return jsonResponse({ error: 'invalid_signature' }, 401);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      logEvent('warn', 'whatsapp_ingestion.invalid_json');
      return jsonResponse({ error: 'invalid_payload' }, 400);
    }

    const envelopeResult = gatewayEnvelopeSchema.safeParse(parsedJson);
    if (!envelopeResult.success) {
      logEvent('warn', 'whatsapp_ingestion.invalid_envelope');
      return jsonResponse({ error: 'invalid_payload' }, 400);
    }

    const envelope = envelopeResult.data;
    logEvent('info', 'whatsapp_ingestion.received', {
      externalEventId: envelope.id,
      type: envelope.type,
    });

    if (envelope.type !== 'message.upsert') {
      logEvent('info', 'whatsapp_ingestion.ignored', {
        externalEventId: envelope.id,
        reason: 'unsupported_event',
      });
      return jsonResponse({ accepted: true, relevant: false, reason: 'unsupported_event' });
    }

    const payloadResult = messageUpsertPayloadSchema.safeParse(envelope.payload);
    if (!payloadResult.success) {
      logEvent('warn', 'whatsapp_ingestion.invalid_message', { externalEventId: envelope.id });
      return jsonResponse({ error: 'invalid_payload' }, 400);
    }

    try {
      const outcome = await ingestMessageUpsert(envelope, payloadResult.data, dependencies.ingestion);
      const relevant = outcome === 'persisted' || outcome === 'duplicate';
      logEvent('info', `whatsapp_ingestion.${outcome}`, {
        externalEventId: envelope.id,
        chatId: payloadResult.data.chatId,
        messageType: payloadResult.data.messageType,
      });
      return jsonResponse({ accepted: true, relevant, outcome });
    } catch {
      logEvent('error', 'whatsapp_ingestion.internal_error', { externalEventId: envelope.id });
      return jsonResponse({ error: 'internal_error' }, 500);
    }
  };
