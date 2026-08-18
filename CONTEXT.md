# TemAqui — Contexto do Produto

## Problema

Grupos comunitários de WhatsApp concentram ofertas, demandas e recomendações locais, mas funcionam como uma corrente temporal. Informações úteis desaparecem rapidamente no histórico e não se tornam pesquisáveis.

## Contexto econômico e hipótese

Pequenos comerciantes, autônomos e moradores anunciam produtos e serviços e procuram fornecedores nesses grupos. A hipótese do TemAqui é que essa comunicação contém sinais suficientes para construir, futuramente, uma visão útil da economia hiperlocal.

## Primeiro piloto

O primeiro piloto será em um grupo comunitário do Conjunto João Paulo II, em Manaus/AM. Esse local é configuração operacional, não regra de negócio. O domínio admite a relação futura `City → Neighborhood → Source`, sem implementar gestão geográfica sofisticada nesta etapa.

## Público

- Moradores procurando produtos, serviços e recomendações.
- Comerciantes e profissionais locais buscando visibilidade.
- Operadores que acompanham a qualidade da ingestão e, futuramente, sinais econômicos.

## Limites dos sistemas

O WhatsApp é a origem da conversa. O Muirakitan WhatsApp Gateway mantém Baileys, sessões, reconexão, filas e entrega assinada. O TemAqui conhece apenas o contrato HTTP do webhook, autoriza fontes e persiste eventos mínimos para processamento futuro.

O TemAqui não é inicialmente marketplace, delivery, ERP, PDV ou bot de WhatsApp. Também não responde mensagens nem se conecta diretamente ao WhatsApp.

## Visão futura

Após validação da ingestão: filtro de ruído, classificação `DEMAND | SUPPLY | IRRELEVANT`, sinais econômicos, agregação, busca, catálogo, páginas de comerciantes e analytics.

## Limitações atuais

- Somente mensagens de texto de grupos autorizados são armazenadas.
- Não há classificação, OCR, transcrição, análise de mídia ou histórico retroativo.
- O conteúdo bruto tem retenção temporária configurável.
- Cadastro de fontes é operacional via script; não há painel administrativo.
