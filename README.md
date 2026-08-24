# TemAqui

Vertical slice inicial para consumir mensagens de grupos autorizados através do Muirakitan WhatsApp Gateway.

## Desenvolvimento

```bash
cp .env.example .env
npm install
npm run dev
```

Webhook: `POST http://localhost:3000/api/internal/webhooks/whatsapp`.

Painel operacional local: `http://localhost:3001/ops`. Ele é habilitado apenas
em desenvolvimento e exibe métricas e metadados, nunca textos ou identidades.

Cadastre um grupo autorizado usando seu `chatId`:

```bash
npm run source:add -- 120363000000000000@g.us
```

Auditoria agregada e somente leitura da classificação nos eventos mais recentes:

```bash
npm run classification:audit -- 1000
```

O relatório contém apenas contagens de ruído, intenções e sinais; os corpos das
mensagens nunca são impressos.

Migração idempotente de privacidade para eventos armazenados anteriormente:

```bash
npm run privacy:migrate
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

## Estado atual

Em 24/08/2026, o fluxo real foi validado localmente de ponta a ponta com uma
sessão restaurável do Gateway: mensagem de grupo autorizada recebida via webhook
HMAC, persistida no Atlas e descartes de grupo desconhecido/chat privado
observados. O envio outbound `Paz e Bem !` também retornou como evento `fromMe` e
foi persistido pelo TemAqui.
