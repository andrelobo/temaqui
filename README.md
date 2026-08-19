# TemAqui

Vertical slice inicial para consumir mensagens de grupos autorizados através do Muirakitan WhatsApp Gateway.

## Desenvolvimento

```bash
cp .env.example .env.local
npm install
npm run dev
```

Webhook: `POST http://localhost:3000/api/internal/webhooks/whatsapp`.

Cadastre um grupo autorizado usando seu `chatId`:

```bash
npm run source:add -- 120363000000000000@g.us
```

## Validação

```bash
npm run lint
npm test
npm run test:integration # usa o Atlas configurado em .env
npm run build
```

Consulte [CONTEXT.md](./CONTEXT.md), [SPEC.md](./SPEC.md),
[docs/architecture.md](./docs/architecture.md) e o
[runbook de teste real](./docs/runbook-whatsapp-to-mongo.md).
