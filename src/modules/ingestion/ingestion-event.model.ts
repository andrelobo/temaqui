import mongoose, { type InferSchemaType, type Model } from 'mongoose';
import { economicIntents } from '@/modules/classification/economic-intent-classifier';

const { Schema, model, models } = mongoose;

export const processingStatuses = [
  'RECEIVED',
  'PENDING_CLASSIFICATION',
  'CLASSIFIED',
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
    bodyRetained: { type: Boolean, required: true, default: true },
    redactionTypes: { type: [String], required: true, default: [] },
    contentFingerprint: { type: String, required: true },
    repeatedPromotionOf: { type: Schema.Types.ObjectId, ref: 'IngestionEvent', required: false },
    economicIntent: { type: String, enum: economicIntents, required: true },
    classificationMethod: { type: String, enum: ['RULES_V1'], required: true },
    classificationSignals: { type: [String], required: true, default: [] },
    classifiedAt: { type: Date, required: true },
    occurredAt: { type: Date, required: false },
    receivedAt: { type: Date, required: true, default: Date.now },
    processingStatus: { type: String, enum: processingStatuses, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

ingestionEventSchema.index({ provider: 1, externalEventId: 1 }, { unique: true });
ingestionEventSchema.index({ receivedAt: -1 });
ingestionEventSchema.index({ sourceId: 1, contentFingerprint: 1, receivedAt: -1 });
ingestionEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type IngestionEvent = InferSchemaType<typeof ingestionEventSchema>;

export const IngestionEventModel =
  (models.IngestionEvent as Model<IngestionEvent> | undefined) ??
  model<IngestionEvent>('IngestionEvent', ingestionEventSchema);
