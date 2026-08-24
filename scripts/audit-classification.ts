import mongoose from 'mongoose';
import { z } from 'zod';
import { createClassificationAudit } from '../src/modules/classification/classification-audit';
import { IngestionEventModel } from '../src/modules/ingestion/ingestion-event.model';
import { connectMongo } from '../src/shared/db/mongoose';

const argsSchema = z.tuple([z.coerce.number().int().positive().max(10_000).default(1_000)]);

const main = async () => {
  const [limit] = argsSchema.parse(process.argv.slice(2));
  await connectMongo();
  const events = await IngestionEventModel.find({ body: { $type: 'string', $ne: '' } })
    .sort({ receivedAt: -1 })
    .limit(limit)
    .select({ _id: 0, body: 1 })
    .lean()
    .exec();
  console.log(JSON.stringify(createClassificationAudit(events.map(({ body }) => body)), null, 2));
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Falha ao auditar classificação');
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
