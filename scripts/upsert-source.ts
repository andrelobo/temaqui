import mongoose from 'mongoose';
import { z } from 'zod';
import { connectMongo } from '../src/shared/db/mongoose';
import { SourceModel } from '../src/modules/sources/source.model';

const argsSchema = z.tuple([z.string().endsWith('@g.us'), z.string().optional()]);

const main = async () => {
  const [externalId, neighborhoodId] = argsSchema.parse(process.argv.slice(2));
  await connectMongo();
  const source = await SourceModel.findOneAndUpdate(
    { type: 'WHATSAPP_GROUP', externalId },
    {
      $set: { active: true, ...(neighborhoodId ? { neighborhoodId } : {}) },
      $setOnInsert: { type: 'WHATSAPP_GROUP', externalId },
    },
    { upsert: true, new: true },
  ).exec();
  console.log(JSON.stringify({ id: String(source._id), externalId: source.externalId }));
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Falha ao cadastrar Source');
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
