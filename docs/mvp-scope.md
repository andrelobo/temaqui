# Escopo do MVP

## Implementado nesta rodada

- Recepção do webhook do Muirakitan Gateway.
- HMAC SHA-256 e comparação timing-safe.
- Validação de contrato com Zod.
- Allowlist de grupos por `Source.externalId = chatId`.
- Persistência mínima e idempotente.
- Retenção TTL configurável.
- Logs estruturados e testes.

## Escopo futuro do MVP

- Classificação de demanda, oferta e irrelevância.
- Sinais econômicos e agregações.
- Catálogo, busca e páginas de comerciantes.
- Conversão pelo WhatsApp.
- Analytics e administração.

## Fora desta rodada

IA, embeddings, classificação, `DemandSignal`, `SupplySignal`, catálogo, login, pagamentos, anúncios, delivery, mapa, bot, respostas automáticas, envio de mensagens, Baileys, Redis, BullMQ e microserviços.
