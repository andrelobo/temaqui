import { createHmac, timingSafeEqual } from 'node:crypto';

const SHA256_HEX_LENGTH = 64;

export const signWebhookBody = (rawBody: string, secret: string): string =>
  createHmac('sha256', secret).update(rawBody).digest('hex');

export const verifyWebhookSignature = (
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean => {
  if (!signature || signature.length !== SHA256_HEX_LENGTH || !/^[a-f0-9]+$/i.test(signature)) {
    return false;
  }

  const expected = Buffer.from(signWebhookBody(rawBody, secret), 'hex');
  const received = Buffer.from(signature, 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
};
