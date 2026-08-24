import { describe, expect, it } from 'vitest';
import { detectTextNoise } from './text-noise-filter';

describe('detectTextNoise', () => {
  it.each([
    ['Bom dia!', 'greeting_only'],
    ['OLÁ 👋', 'greeting_only'],
    ['Paz e Bem !', 'greeting_only'],
    ['Obrigado 🙏', 'acknowledgement_only'],
    ['ok', 'acknowledgement_only'],
    ['🙏🏽❤️', 'symbols_only'],
  ] as const)('marks %s as %s', (body, reason) => {
    expect(detectTextNoise(body)).toEqual({ isNoise: true, reason });
  });

  it.each([
    'Bom dia, estou vendendo bolo de pote',
    'Ok, quem conhece um eletricista?',
    'Preciso de gás hoje',
    'https://example.com/produto',
    'Bolo por R$ 5',
  ])('preserves potentially useful text: %s', (body) => {
    expect(detectTextNoise(body)).toEqual({ isNoise: false });
  });
});
