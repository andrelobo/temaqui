import { connectMongo } from '@/shared/db/mongoose';
import { IngestionEventModel } from './ingestion-event.model';
import { SourceModel } from '@/modules/sources/source.model';
import type { IngestionDependencies } from './ingestion.service';

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;

export const createMongooseIngestionDependencies = (
  retentionDays: number,
): IngestionDependencies => ({
  retentionDays,
  findActiveSource: async (chatId) => {
    await connectMongo();
    const source = await SourceModel.findOne({
      type: 'WHATSAPP_GROUP',
      externalId: chatId,
      active: true,
    })
      .select({ _id: 1 })
      .lean()
      .exec();
    return source ? { id: String(source._id) } : null;
  },
  persist: async (input) => {
    await connectMongo();
    try {
      await IngestionEventModel.create(input);
      return 'created';
    } catch (error) {
      if (isDuplicateKeyError(error)) return 'duplicate';
      throw error;
    }
  },
});
