export const economicIntents = ['DEMAND', 'SUPPLY', 'REPEATED_PROMOTION', 'IRRELEVANT'] as const;

export type EconomicIntent = (typeof economicIntents)[number];

export interface EconomicIntentClassification {
  intent: EconomicIntent;
  method: 'RULES_V1';
  matchedSignals: string[];
}

interface IntentRule {
  signal: string;
  pattern: RegExp;
}

const demandRules: IntentRule[] = [
  { signal: 'need', pattern: /\b(preciso|necessito|to precisando|estou precisando)\b/iu },
  { signal: 'search', pattern: /\b(procuro|procurando|busco|buscando)\b/iu },
  { signal: 'recommendation', pattern: /\b(indica(?:cao|m)?|recomenda(?:cao|m)?|alguem conhece)\b/iu },
  { signal: 'where_to_buy', pattern: /\b(onde (?:acho|compro|encontro|tem))\b/iu },
  { signal: 'who_provides', pattern: /\b(quem (?:faz|vende|tem|trabalha com))\b/iu },
];

const supplyRules: IntentRule[] = [
  { signal: 'selling', pattern: /\b(vendo|vende se|estou vendendo)\b/iu },
  { signal: 'offering', pattern: /\b(ofereco|trabalho com|faco|aceito encomendas)\b/iu },
  { signal: 'availability', pattern: /\b(temos|disponivel|pronta entrega)\b/iu },
  { signal: 'promotion', pattern: /\b(promocao|oferta|desconto)\b/iu },
  { signal: 'delivery', pattern: /\b(entrego|entregamos|delivery)\b/iu },
  { signal: 'delivery', pattern: /\b(fazemos entrega|entrega com taxa)\b/iu },
  { signal: 'menu', pattern: /\b(cardapio|quentinha|refeicao)\b/iu },
  { signal: 'payment', pattern: /\b(pix|cartao|credito|debito)\b/iu },
  { signal: 'price', pattern: /(?:\br\$\s*\d|\bpor\s+\d+(?:[,.]\d{1,2})?\s*reais?\b)/iu },
];

const normalizeText = (body: string): string =>
  body
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const matches = (body: string, rules: IntentRule[]): string[] =>
  rules.filter(({ pattern }) => pattern.test(body)).map(({ signal }) => signal);

export const classifyEconomicIntent = (body: string): EconomicIntentClassification => {
  const normalized = normalizeText(body);
  const demandSignals = matches(normalized, demandRules);
  const supplySignals = matches(normalized, supplyRules);

  if (demandSignals.length === 0 && supplySignals.length === 0) {
    return { intent: 'IRRELEVANT', method: 'RULES_V1', matchedSignals: [] };
  }

  if (demandSignals.length > supplySignals.length) {
    return { intent: 'DEMAND', method: 'RULES_V1', matchedSignals: demandSignals };
  }

  return { intent: 'SUPPLY', method: 'RULES_V1', matchedSignals: supplySignals };
};
