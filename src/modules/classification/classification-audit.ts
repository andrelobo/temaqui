import { classifyEconomicIntent, economicIntents } from './economic-intent-classifier';
import { detectTextNoise, type TextNoiseReason } from './text-noise-filter';

const noiseReasons: TextNoiseReason[] = [
  'symbols_only',
  'greeting_only',
  'acknowledgement_only',
];

export interface ClassificationAuditReport {
  sampled: number;
  noise: { total: number; byReason: Record<TextNoiseReason, number> };
  classified: {
    total: number;
    byIntent: Record<(typeof economicIntents)[number], number>;
    bySignal: Record<string, number>;
  };
}

export const createClassificationAudit = (bodies: Iterable<string>): ClassificationAuditReport => {
  const report: ClassificationAuditReport = {
    sampled: 0,
    noise: {
      total: 0,
      byReason: Object.fromEntries(noiseReasons.map((reason) => [reason, 0])) as Record<
        TextNoiseReason,
        number
      >,
    },
    classified: {
      total: 0,
      byIntent: Object.fromEntries(economicIntents.map((intent) => [intent, 0])) as Record<
        (typeof economicIntents)[number],
        number
      >,
      bySignal: {},
    },
  };

  for (const body of bodies) {
    report.sampled += 1;
    const noise = detectTextNoise(body);
    if (noise.isNoise) {
      report.noise.total += 1;
      report.noise.byReason[noise.reason] += 1;
      continue;
    }
    const classification = classifyEconomicIntent(body);
    report.classified.total += 1;
    report.classified.byIntent[classification.intent] += 1;
    for (const signal of classification.matchedSignals) {
      report.classified.bySignal[signal] = (report.classified.bySignal[signal] ?? 0) + 1;
    }
  }

  report.classified.bySignal = Object.fromEntries(
    Object.entries(report.classified.bySignal).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
  return report;
};
