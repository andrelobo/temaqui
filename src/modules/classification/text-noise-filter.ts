export type TextNoiseReason = 'symbols_only' | 'greeting_only' | 'acknowledgement_only';

export type TextNoiseResult =
  | { isNoise: false }
  | { isNoise: true; reason: TextNoiseReason };

const greetings = new Set([
  'bom dia',
  'boa tarde',
  'boa noite',
  'oi',
  'ola',
  'paz e bem',
]);

const acknowledgements = new Set([
  'blz',
  'obg',
  'obrigada',
  'obrigado',
  'ok',
  'show',
  'sim',
  'ta bom',
  'valeu',
]);

const normalizeText = (body: string): string =>
  body
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');

export const detectTextNoise = (body: string): TextNoiseResult => {
  const normalized = normalizeText(body);
  if (normalized.length === 0) return { isNoise: true, reason: 'symbols_only' };
  if (greetings.has(normalized)) return { isNoise: true, reason: 'greeting_only' };
  if (acknowledgements.has(normalized)) {
    return { isNoise: true, reason: 'acknowledgement_only' };
  }
  return { isNoise: false };
};
