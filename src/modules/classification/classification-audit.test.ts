import { describe, expect, it } from 'vitest';
import { createClassificationAudit } from './classification-audit';

describe('createClassificationAudit', () => {
  it('returns aggregate counts without retaining message bodies', () => {
    const report = createClassificationAudit([
      'Bom dia!',
      'Preciso de gás',
      'Vendo bolo por R$ 5',
      'A reunião começa às 19h',
    ]);
    expect(report).toEqual({
      sampled: 4,
      noise: {
        total: 1,
        byReason: {
          symbols_only: 0,
          greeting_only: 1,
          acknowledgement_only: 0,
        },
      },
      classified: {
        total: 3,
        byIntent: { DEMAND: 1, SUPPLY: 1, REPEATED_PROMOTION: 0, IRRELEVANT: 1 },
        bySignal: { need: 1, price: 1, selling: 1 },
      },
    });
    expect(JSON.stringify(report)).not.toContain('Preciso de gás');
  });

  it('handles an empty sample', () => {
    expect(createClassificationAudit([])).toMatchObject({
      sampled: 0,
      noise: { total: 0 },
      classified: { total: 0, bySignal: {} },
    });
  });
});
