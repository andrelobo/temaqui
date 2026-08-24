import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { signWebhookBody } from '@/shared/security/hmac';
import { createWhatsappWebhookHandler } from './whatsapp-webhook.handler';
import type { IngestionDependencies } from './ingestion.service';

const secret = 'test-secret-with-32-characters!!';
const now = new Date('2026-08-18T12:00:00.000Z');

const envelope = (payload: Record<string, unknown>, type = 'message.upsert') => ({
  id: 'event-1',
  type,
  sessionId: 'session-1',
  payload,
  timestamp: '2026-08-18T12:00:00.000Z',
});

const groupPayload = {
  chatId: '120363000000000000@g.us',
  chatType: 'GROUP',
  senderId: '5511999999999@s.whatsapp.net',
  fromMe: false,
  body: 'Alguém conhece eletricista?',
  timestamp: 1_700_000_001,
  messageType: 'conversation',
};

const signedRequest = (data: unknown, signatureSecret = secret): Request => {
  const rawBody = JSON.stringify(data);
  return new Request('http://localhost/api/internal/webhooks/whatsapp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-muirakitan-signature': signWebhookBody(rawBody, signatureSecret),
    },
    body: rawBody,
  });
};

describe('WhatsApp webhook handler', () => {
  let ingestion: IngestionDependencies;
  let findActiveSource: MockedFunction<IngestionDependencies['findActiveSource']>;
  let persist: MockedFunction<IngestionDependencies['persist']>;

  beforeEach(() => {
    findActiveSource = vi
      .fn<IngestionDependencies['findActiveSource']>()
      .mockResolvedValue({ id: 'source-1' });
    persist = vi.fn<IngestionDependencies['persist']>().mockResolvedValue('created');
    ingestion = { findActiveSource, persist, retentionDays: 30, now: () => now };
  });

  const handler = () => createWhatsappWebhookHandler({ secret, ingestion });

  it('accepts a correctly signed authorized group message', async () => {
    const response = await handler()(signedRequest(envelope(groupPayload)));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ outcome: 'persisted', relevant: true });
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        externalEventId: 'event-1',
        sourceId: 'source-1',
        body: groupPayload.body,
        processingStatus: 'PENDING_CLASSIFICATION',
        expiresAt: new Date('2026-09-17T12:00:00.000Z'),
      }),
    );
    expect(persist.mock.calls[0][0]).not.toHaveProperty('senderId');
  });

  it('rejects an invalid signature', async () => {
    const response = await handler()(signedRequest(envelope(groupPayload), 'different-secret-123'));
    expect(response.status).toBe(401);
    expect(persist).not.toHaveBeenCalled();
  });

  it('rejects an invalid payload', async () => {
    const response = await handler()(signedRequest({ type: 'message.upsert' }));
    expect(response.status).toBe(400);
  });

  it('ignores a private chat', async () => {
    const response = await handler()(
      signedRequest(envelope({ ...groupPayload, chatType: 'PRIVATE', chatId: '1@lid' })),
    );
    expect(await response.json()).toMatchObject({ outcome: 'ignored_private', relevant: false });
    expect(findActiveSource).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it('ignores an unknown group', async () => {
    findActiveSource.mockResolvedValue(null);
    const response = await handler()(signedRequest(envelope(groupPayload)));
    expect(await response.json()).toMatchObject({ outcome: 'ignored_unknown_source' });
    expect(persist).not.toHaveBeenCalled();
  });

  it('ignores an inactive group through the active-source query', async () => {
    findActiveSource.mockResolvedValue(null);
    const response = await handler()(signedRequest(envelope(groupPayload)));
    expect(response.status).toBe(200);
    expect(persist).not.toHaveBeenCalled();
  });

  it('treats a duplicate as success without creating another logical event', async () => {
    persist.mockResolvedValue('duplicate');
    const response = await handler()(signedRequest(envelope(groupPayload)));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ outcome: 'duplicate', relevant: true });
  });

  it('does not discard a message only because fromMe is true', async () => {
    const response = await handler()(
      signedRequest(envelope({ ...groupPayload, fromMe: true, senderId: undefined })),
    );
    expect(response.status).toBe(200);
    expect(persist).toHaveBeenCalledWith(expect.objectContaining({ fromMe: true }));
  });

  it('ignores an empty body without consulting Source', async () => {
    const response = await handler()(signedRequest(envelope({ ...groupPayload, body: '' })));
    expect(await response.json()).toMatchObject({ outcome: 'ignored_empty_body' });
    expect(findActiveSource).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it('ignores unequivocal textual noise without consulting Source', async () => {
    const response = await handler()(
      signedRequest(envelope({ ...groupPayload, body: 'Bom dia! 👋' })),
    );
    expect(await response.json()).toMatchObject({ outcome: 'ignored_noise', relevant: false });
    expect(findActiveSource).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it('keeps a greeting when it also contains an economic signal', async () => {
    const response = await handler()(
      signedRequest(envelope({ ...groupPayload, body: 'Bom dia, estou vendendo bolo' })),
    );
    expect(await response.json()).toMatchObject({ outcome: 'persisted', relevant: true });
    expect(persist).toHaveBeenCalledOnce();
  });

  it('accepts an unused valid Gateway event without persistence', async () => {
    const response = await handler()(
      signedRequest(envelope({ state: 'open' }, 'connection.update')),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ relevant: false, reason: 'unsupported_event' });
    expect(persist).not.toHaveBeenCalled();
  });

  it('rejects an oversized body before validation', async () => {
    const body = 'x'.repeat(256 * 1024 + 1);
    const request = new Request('http://localhost/api/internal/webhooks/whatsapp', {
      method: 'POST',
      headers: { 'x-muirakitan-signature': signWebhookBody(body, secret) },
      body,
    });
    const response = await handler()(request);
    expect(response.status).toBe(413);
  });
});
