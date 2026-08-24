# Backlog

## Próxima etapa

1. Política de descarte antecipado do corpo após classificação.

## Concluído após a fundação

- Filtro conservador de ruído textual para saudações, confirmações e
  conteúdo composto apenas por símbolos, sem descartar frases que também tragam
  possível oferta ou demanda.
- Classificador determinístico `RULES_V1` de intenção
  `DEMAND | SUPPLY | IRRELEVANT`, com sinais auditáveis em português.
- Auditor somente leitura para medir ruído, intenções e sinais em eventos reais,
  sem imprimir nem incorporar os corpos das mensagens ao relatório.
- Anonimização de Pix, CPF, telefone e e-mail antes da persistência.
- Deduplicação de promoções por impressão digital normalizada em janela de sete
  dias; republicações são `REPEATED_PROMOTION` e não retêm o corpo.

## Etapas posteriores

1. `EconomicSignal` e taxonomia de categorias.
2. Agregação e detecção de oportunidades.
3. Catálogo, busca e aquisição de comerciantes.
4. Páginas públicas, analytics e administração.

## Mídia

Avaliar separadamente OCR, transcrição de áudio e análise de imagem. Nenhuma mídia é baixada nesta versão.
