import { describe, expect, it } from 'vitest';
import { classifyEconomicIntent } from './economic-intent-classifier';

describe('classifyEconomicIntent', () => {
  it.each([
    'Preciso de um eletricista hoje',
    'Alguém conhece uma costureira?',
    'Onde compro gás por aqui?',
    'Quem vende bolo no bairro?',
  ])('classifies demand: %s', (body) => {
    expect(classifyEconomicIntent(body)).toMatchObject({
      intent: 'DEMAND',
      method: 'RULES_V1',
    });
  });

  it.each([
    'Vendo bolo de pote',
    'Faço manutenção de ar-condicionado',
    'Temos quentinhas disponíveis',
    'Promoção: bolo por R$ 5',
    'Entregamos gás no bairro',
  ])('classifies supply: %s', (body) => {
    expect(classifyEconomicIntent(body)).toMatchObject({
      intent: 'SUPPLY',
      method: 'RULES_V1',
    });
  });

  it.each([
    'A reunião começa às 19h',
    'O ônibus acabou de passar',
    'Que chuva forte',
  ])('classifies irrelevant text: %s', (body) => {
    expect(classifyEconomicIntent(body)).toEqual({
      intent: 'IRRELEVANT',
      method: 'RULES_V1',
      matchedSignals: [],
    });
  });

  it('uses the strongest side and resolves a tie as supply', () => {
    expect(classifyEconomicIntent('Preciso vender meu fogão, vendo por R$ 300')).toMatchObject({
      intent: 'SUPPLY',
    });
  });
});
