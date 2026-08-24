import mongoose, { type InferSchemaType, type Model } from 'mongoose';

const { Schema, model, models } = mongoose;

export const sourceTypes = ['WHATSAPP_GROUP'] as const;

const sourceSchema = new Schema(
  {
    type: { type: String, enum: sourceTypes, required: true },
    externalId: { type: String, required: true, trim: true },
    neighborhoodId: { type: Schema.Types.ObjectId, required: false, ref: 'Neighborhood' },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

sourceSchema.index({ type: 1, externalId: 1 }, { unique: true });
sourceSchema.index({ type: 1, externalId: 1, active: 1 });

export type Source = InferSchemaType<typeof sourceSchema>;

export const SourceModel =
  (models.Source as Model<Source> | undefined) ?? model<Source>('Source', sourceSchema);
