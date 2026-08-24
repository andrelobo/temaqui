export type RedactionType = 'PIX' | 'CPF' | 'PHONE' | 'EMAIL';
export interface RedactedText { text: string; redactionTypes: RedactionType[] }

const rules: Array<{ type: RedactionType; pattern: RegExp; replacement: string }> = [
  { type: 'PIX', pattern: /((?:chave\s+)?pix)\s*[:*-]?\s*[*_\x60]?([+\w.@-]{5,})[*_\x60]?/giu, replacement: '$1 [PIX_REDACTED]' },
  { type: 'CPF', pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gu, replacement: '[CPF_REDACTED]' },
  { type: 'EMAIL', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, replacement: '[EMAIL_REDACTED]' },
  { type: 'PHONE', pattern: /(?<!\d)(?:\+?55[\s.-]*)?(?:\(?\d{2}\)?[\s.-]*)?9?\d{4}[\s.-]*-?\d{4}(?!\d)/gu, replacement: '[PHONE_REDACTED]' },
];

export const redactSensitiveText = (body: string): RedactedText => {
  const redactionTypes = new Set<RedactionType>();
  let text = body;
  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      redactionTypes.add(rule.type);
      rule.pattern.lastIndex = 0;
      text = text.replace(rule.pattern, rule.replacement);
    }
  }
  return { text, redactionTypes: [...redactionTypes] };
};
