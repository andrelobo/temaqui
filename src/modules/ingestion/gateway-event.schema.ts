import { z } from 'zod';

export const gatewayEnvelopeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  sessionId: z.string().min(1),
  payload: z.unknown(),
  timestamp: z.iso.datetime(),
});

export const messageUpsertPayloadSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  chatId: z.string().min(1),
  chatType: z.enum(['PRIVATE', 'GROUP']),
  senderId: z.string().optional(),
  fromMe: z.boolean(),
  body: z.string(),
  timestamp: z.number().finite().nonnegative().optional(),
  messageType: z.string().min(1),
});

export type GatewayEnvelope = z.infer<typeof gatewayEnvelopeSchema>;
export type MessageUpsertPayload = z.infer<typeof messageUpsertPayloadSchema>;
