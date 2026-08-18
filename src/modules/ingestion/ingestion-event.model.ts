import { InferSchemaType, Model, Schema, model, models } from 'mongoose';

export const processingStatuses = [
  'RECEIVED',
  'PENDING_CLASSIFICATION',
  'IGNORED',
  'FAILED',
] as const;

const ingestionEventSchema = new Schema(
  {
    provider: { type: String, enum: ['MUIRAKITAN_WHATSAPP'], required: true },
    externalEventId: { type: String, required: true },
    sourceId: { type: Schema.Types.ObjectId, ref: 'Source', required: true },
    sessionId: { type: String, required: true },
    messageType: { type: String, required: true },
    fromMe: { type: Boolean, required: true },
    body: { type: String, required: true },
    occurredAt: { type: Date, required: false },
    receivedAt: { type: Date, required: true, default: Date.now },
    processingStatus: { type: String, enum: processingStatuses, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

ingestionEventSchema.index({ provider: 1, externalEventId: 1 }, { unique: true });
ingestionEventSchema.index({ receivedAt: -1 });
ingestionEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type IngestionEvent = InferSchemaType<typeof ingestionEventSchema>;

export const IngestionEventModel =
  (models.IngestionEvent as Model<IngestionEvent> | undefined) ??
  model<IngestionEvent>('IngestionEvent', ingestionEventSchema);
