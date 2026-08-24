import { describe, expect, it } from 'vitest';
import { redactSensitiveText } from './sensitive-text-redactor';

describe('redactSensitiveText', () => {
  it('redacts the Pix key from the observed restaurant format', () => {
    const result = redactSensitiveText('CHAVE PIX *92994444516*\nPAGAMENTO NO PIX');
    expect(result.text).toContain('CHAVE PIX [PIX_REDACTED]');
    expect(result.text).not.toContain('92994444516');
    expect(result.redactionTypes).toContain('PIX');
  });
  it('redacts CPF, email and Brazilian phone formats', () => {
    const result = redactSensitiveText('CPF 123.456.789-01, email pessoa@example.com, telefone (92) 99999-1234');
    expect(result.text).toBe('CPF [CPF_REDACTED], email [EMAIL_REDACTED], telefone [PHONE_REDACTED]');
    expect(result.redactionTypes).toEqual(['CPF', 'EMAIL', 'PHONE']);
  });
  it('does not redact menu prices', () => {
    expect(redactSensitiveText('R$ 10,00 e refrigerante 8,00')).toEqual({
      text: 'R$ 10,00 e refrigerante 8,00',
      redactionTypes: [],
    });
  });
});
