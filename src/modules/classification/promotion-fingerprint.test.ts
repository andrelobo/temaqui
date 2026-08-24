import { describe, expect, it } from 'vitest';
import { createPromotionFingerprint } from './promotion-fingerprint';

describe('createPromotionFingerprint', () => {
  it('matches reposts with formatting and price changes', () => {
    expect(createPromotionFingerprint('CARDÁPIO\nBolo R$ 10,00\nEntrega com taxa')).toBe(
      createPromotionFingerprint('Cardapio: bolo R$ 12,00 - entrega com taxa!'),
    );
  });
  it('separates different offers', () => {
    expect(createPromotionFingerprint('Vendo bolo')).not.toBe(createPromotionFingerprint('Faço manutenção de geladeira'));
  });
});
