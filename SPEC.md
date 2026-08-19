# TemAqui — Especificação do Vertical Slice de Ingestão

## Objetivo

Comprovar o fluxo `WhatsApp → Muirakitan Gateway → webhook HMAC → TemAqui → Source → IngestionEvent → MongoDB` sem implementar classificação econômica.

## Endpoint

`POST /api/internal/webhooks/whatsapp`, com runtime Node.js.

O endpoint lê no máximo 256 KiB, preserva o corpo cru, valida `X-Muirakitan-Signature`, interpreta JSON e valida envelope/payload com Zod.

## Regras

1. Assinatura inválida: `401`.
2. JSON ou contrato inválido: `400`.
3. Corpo excessivo: `413`.
4. Evento válido diferente de `message.upsert`: `200`, não persistido.
5. Chat privado: `200`, não persistido.
6. Grupo sem `Source` ativa: `200`, não persistido.
7. Mensagem sem texto: `200`, não persistida.
8. Grupo autorizado com texto: persistir e responder `200`.
9. Evento duplicado: não duplicar e responder `200`.
10. `fromMe` não elimina uma mensagem.

## Contrato consumido

```json
{
  "id": "evento-id",
  "type": "message.upsert",
  "sessionId": "sessao-id",
  "payload": {
    "from": "120363000000000000@g.us",
    "to": "5511888888888@s.whatsapp.net",
    "chatId": "120363000000000000@g.us",
    "chatType": "GROUP",
    "senderId": "5511888888888@s.whatsapp.net",
    "fromMe": false,
    "body": "Tem alguém por perto?",
    "timestamp": 1700000001,
    "messageType": "extendedTextMessage"
  },
  "timestamp": "2026-08-18T00:00:00.000Z"
}
```

`senderId`, `from`, `to` e o timestamp interno são opcionais. O TemAqui não persiste `senderId`, `from`, `to`, nomes, perfis ou fotos.

## Persistência

### Source

`{ type: 'WHATSAPP_GROUP', externalId: chatId, neighborhoodId?, active }`.

Há unicidade em `(type, externalId)` e índice de busca em `(type, externalId, active)`.

### IngestionEvent

Persiste provider, ID externo, Source, sessão, tipo da mensagem, `fromMe`, corpo, datas, status e expiração. Há índice único `(provider, externalEventId)` e TTL em `expiresAt`.

## Observabilidade

Logs JSON registram recebimento, rejeição, descarte, duplicidade, persistência e falhas sem corpo, segredo ou identidade do remetente.

## Configuração

- `MONGODB_URI`
- `MONGODB_DB_NAME`, padrão `temaqui`
- `MUIRAKITAN_WEBHOOK_SECRET` com pelo menos 16 caracteres
- `INGESTION_RETENTION_DAYS`, padrão 30

`MONGODB_DB_NAME` é passado explicitamente ao Mongoose. Isso impede que uma URI sem nome de banco grave acidentalmente no banco padrão `test`.

## Estado de validação

- Conexão e `ping` no MongoDB Atlas: aprovados.
- Banco selecionado: `temaqui`.
- Lint: aprovado.
- Testes automatizados: 11 aprovados.
- Build de produção Next.js: aprovado.
- Teste ponta a ponta com WhatsApp e Gateway reais: pendente de URL pública, configuração do tenant e `Source` do grupo piloto.
