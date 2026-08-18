# Runbook — WhatsApp real até MongoDB

Este roteiro comprova o vertical slice sem adicionar classificação ou outro coletor.

## 1. Pré-requisitos

- Uma sessão aberta no Muirakitan WhatsApp Gateway.
- O tenant e sua API key no Gateway.
- O `chatId` do grupo autorizado, no formato `...@g.us`.
- Um banco MongoDB Atlas acessível pelo TemAqui.
- Uma URL HTTPS pública do TemAqui, por exemplo uma implantação na Vercel.
- Um segredo aleatório compartilhado somente entre Gateway e TemAqui.

## 2. Configurar o TemAqui

Defina no ambiente local ou na Vercel:

```dotenv
MONGODB_URI=mongodb+srv://...
MUIRAKITAN_WEBHOOK_SECRET=um-segredo-aleatorio-com-pelo-menos-16-caracteres
INGESTION_RETENTION_DAYS=30
```

Em ambiente local:

```bash
cp .env.example .env.local
npm install
npm run dev
```

O Gateway precisa alcançar uma URL HTTPS pública. Para teste local, exponha a porta 3000 com um túnel HTTPS de sua preferência e use a URL gerada nos passos seguintes.

## 3. Autorizar o grupo

No diretório do TemAqui, usando o mesmo `MONGODB_URI` da aplicação:

```bash
npm run source:add -- 120363000000000000@g.us
```

Substitua o valor pelo `chatId` real. O comando é idempotente e reativa uma Source existente. Não use o nome textual do grupo.

Confirme no Atlas ou no `mongosh`:

```javascript
db.sources.findOne({
  type: "WHATSAPP_GROUP",
  externalId: "120363000000000000@g.us",
  active: true
})
```

## 4. Registrar o webhook no Gateway

Use exatamente o mesmo segredo configurado no TemAqui:

```bash
curl --request POST \
  'https://GATEWAY_HOST/api/tenants/TENANT_ID/webhooks' \
  --header 'Authorization: Bearer TENANT_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "url": "https://TEMAQUI_HOST/api/internal/webhooks/whatsapp",
    "secret": "MESMO_SEGREDO_DO_TEMAQUI"
  }'
```

Não registre a URL de uma página; a rota termina em `/api/internal/webhooks/whatsapp`.

## 5. Executar o teste real

1. Confirme que a sessão do Gateway está `open` e participa do grupo autorizado.
2. Envie no grupo uma mensagem textual nova e facilmente reconhecível, sem dados pessoais desnecessários.
3. Observe os logs do TemAqui. O resultado esperado contém, em sequência:

```json
{"event":"whatsapp_ingestion.received","externalEventId":"...","type":"message.upsert"}
{"event":"whatsapp_ingestion.persisted","externalEventId":"...","chatId":"...","messageType":"conversation"}
```

4. Confirme o documento:

```javascript
db.ingestionevents.find(
  { provider: "MUIRAKITAN_WHATSAPP" },
  {
    externalEventId: 1,
    sourceId: 1,
    sessionId: 1,
    messageType: 1,
    fromMe: 1,
    body: 1,
    occurredAt: 1,
    receivedAt: 1,
    processingStatus: 1,
    expiresAt: 1
  }
).sort({ receivedAt: -1 }).limit(1)
```

O documento não deve conter `senderId`, telefone, nome, perfil ou foto.

## 6. Comprovar os descartes

### Grupo não autorizado

Envie texto em outro grupo da mesma sessão sem cadastrar uma Source. O webhook responde `200`, o log registra `ignored_unknown_source` e nenhum `IngestionEvent` é criado.

### Chat privado

Envie uma mensagem privada para a sessão. O webhook responde `200`, registra `ignored_private` e não persiste.

### Corpo vazio

Envie uma mídia sem legenda. O Gateway envia `body: ""`; o TemAqui registra `ignored_empty_body` e não persiste.

## 7. Comprovar idempotência e HMAC

Copie de um ambiente de teste o corpo JSON exato de um evento já aceito. Não reformate o conteúdo entre assinatura e envio:

```bash
TEMAQUI_RAW_EVENT='{"id":"evento-repetido","type":"message.upsert","sessionId":"sessao-id","payload":{"chatId":"120363000000000000@g.us","chatType":"GROUP","fromMe":false,"body":"Teste de idempotência","messageType":"conversation"},"timestamp":"2026-08-18T12:00:00.000Z"}'
TEMAQUI_SECRET='MESMO_SEGREDO_DO_TEMAQUI'
TEMAQUI_SIGNATURE=$(printf '%s' "$TEMAQUI_RAW_EVENT" | openssl dgst -sha256 -hmac "$TEMAQUI_SECRET" -hex | awk '{print $2}')

curl --request POST \
  'https://TEMAQUI_HOST/api/internal/webhooks/whatsapp' \
  --header 'Content-Type: application/json' \
  --header "X-Muirakitan-Signature: $TEMAQUI_SIGNATURE" \
  --data-binary "$TEMAQUI_RAW_EVENT"
```

Repita o último `curl`. A primeira resposta deve trazer `outcome: "persisted"`; a seguinte, `outcome: "duplicate"`. A consulta abaixo deve retornar `1`:

```javascript
db.ingestionevents.countDocuments({
  provider: "MUIRAKITAN_WHATSAPP",
  externalEventId: "evento-repetido"
})
```

Altere um caractere da assinatura e repita. A resposta esperada é HTTP `401` com `invalid_signature`, sem persistência.

## 8. Critério de conclusão

O teste está comprovado quando há evidência de:

- evento textual de grupo autorizado persistido;
- grupo desconhecido não persistido;
- chat privado não persistido;
- retry com o mesmo `id` sem duplicação;
- assinatura inválida rejeitada;
- logs sem corpo ou identidade do remetente.
