import mongoose from 'mongoose';
import { createPromotionFingerprint } from '../src/modules/classification/promotion-fingerprint';
import { IngestionEventModel } from '../src/modules/ingestion/ingestion-event.model';
import { redactSensitiveText } from '../src/modules/privacy/sensitive-text-redactor';
import { connectMongo } from '../src/shared/db/mongoose';

const main = async () => {
  await connectMongo();
  const events = await IngestionEventModel.find({ body: { $type: 'string', $ne: '' } })
    .sort({ receivedAt: 1 })
    .select({ body: 1, sourceId: 1, receivedAt: 1, economicIntent: 1 })
    .lean()
    .exec();
  const recentSupplies = new Map<string, { id: mongoose.Types.ObjectId; receivedAt: Date }>();
  let redacted = 0;
  let repeated = 0;

  const operations = events.map((event) => {
    const safe = redactSensitiveText(event.body);
    const contentFingerprint = createPromotionFingerprint(safe.text);
    const key = `${event.sourceId}:${contentFingerprint}`;
    const previous = recentSupplies.get(key);
    const withinSevenDays =
      previous !== undefined &&
      event.receivedAt.getTime() - previous.receivedAt.getTime() <= 7 * 24 * 60 * 60 * 1_000;
    const isRepeated = event.economicIntent === 'SUPPLY' && withinSevenDays;
    if (safe.redactionTypes.length > 0) redacted += 1;
    if (isRepeated) repeated += 1;
    if (event.economicIntent === 'SUPPLY' && !isRepeated) {
      recentSupplies.set(key, { id: event._id, receivedAt: event.receivedAt });
    }

    return {
      updateOne: {
        filter: { _id: event._id },
        update: {
          $set: {
            body: isRepeated ? '' : safe.text,
            bodyRetained: !isRepeated,
            redactionTypes: safe.redactionTypes,
            contentFingerprint,
            ...(isRepeated
              ? {
                  economicIntent: 'REPEATED_PROMOTION' as const,
                  repeatedPromotionOf: previous.id,
                }
              : {}),
          },
        },
      },
    };
  });

  if (operations.length > 0) await IngestionEventModel.bulkWrite(operations);
  console.log(JSON.stringify({ scanned: events.length, updated: operations.length, redacted, repeated }));
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Falha na migração de privacidade');
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
