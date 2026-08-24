import { createHash } from 'node:crypto';

const normalizePromotion = (body: string): string =>
  body.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
    .replace(/\[(?:pix|cpf|phone|email)_redacted\]/g, ' redacted ')
    .replace(/\d+(?:[,.]\d+)?/g, ' number ')
    .replace(/[^\p{L}]+/gu, ' ').trim().replace(/\s+/g, ' ');

export const createPromotionFingerprint = (body: string): string =>
  createHash('sha256').update(normalizePromotion(body)).digest('hex');
