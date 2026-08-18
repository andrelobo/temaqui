import { GatewayEnvelope, MessageUpsertPayload } from './gateway-event.schema';

export type IngestionOutcome =
  | 'persisted'
  | 'duplicate'
  | 'ignored_private'
  | 'ignored_empty_body'
  | 'ignored_unknown_source';

export interface IngestionDependencies {
  findActiveSource: (chatId: string) => Promise<{ id: string } | null>;
  persist: (input: {
    provider: 'MUIRAKITAN_WHATSAPP';
    externalEventId: string;
    sourceId: string;
    sessionId: string;
    messageType: string;
    fromMe: boolean;
    body: string;
    occurredAt?: Date;
    receivedAt: Date;
    processingStatus: 'PENDING_CLASSIFICATION';
    expiresAt: Date;
  }) => Promise<'created' | 'duplicate'>;
  now?: () => Date;
  retentionDays: number;
}

export const ingestMessageUpsert = async (
  envelope: GatewayEnvelope,
  payload: MessageUpsertPayload,
  dependencies: IngestionDependencies,
): Promise<IngestionOutcome> => {
  if (payload.chatType !== 'GROUP') return 'ignored_private';
  if (payload.body.trim().length === 0) return 'ignored_empty_body';

  const source = await dependencies.findActiveSource(payload.chatId);
  if (!source) return 'ignored_unknown_source';

  const receivedAt = dependencies.now?.() ?? new Date();
  const expiresAt = new Date(receivedAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + dependencies.retentionDays);
  const result = await dependencies.persist({
    provider: 'MUIRAKITAN_WHATSAPP',
    externalEventId: envelope.id,
    sourceId: source.id,
    sessionId: envelope.sessionId,
    messageType: payload.messageType,
    fromMe: payload.fromMe,
    body: payload.body,
    ...(payload.timestamp !== undefined ? { occurredAt: new Date(payload.timestamp * 1000) } : {}),
    receivedAt,
    processingStatus: 'PENDING_CLASSIFICATION',
    expiresAt,
  });

  return result === 'duplicate' ? 'duplicate' : 'persisted';
};
