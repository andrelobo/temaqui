# Arquitetura

## Estilo

Monólito modular Next.js com App Router. O frontend e a entrada HTTP vivem na mesma unidade de deploy, enquanto regras de ingestão, persistência e segurança permanecem separadas por módulos.

```text
Gateway
  │ POST + raw body + HMAC
  ▼
Route Handler (Node.js)
  ▼
Zod envelope/message validation
  ▼
Ingestion service
  ├── private/empty → ignore
  ├── inactive/unknown Source → ignore
  └── active Source → IngestionEvent
                         ▼
                    MongoDB Atlas
```

## Módulos

- `src/app`: interface e Route Handler.
- `src/modules/ingestion`: contrato externo, regras e evento persistido.
- `src/modules/sources`: allowlist de grupos por `chatId`.
- `src/shared/security`: HMAC sobre corpo cru.
- `src/shared/db`: conexão Mongoose reutilizada em runtime serverless.
- `src/shared/observability`: logs JSON sem conteúdo sensível.
- `src/config`: validação de variáveis de ambiente.

## Decisões de runtime

O Route Handler declara `runtime = 'nodejs'` porque usa `node:crypto` e Mongoose. `request.text()` preserva a representação assinada antes de `JSON.parse`. A conexão Mongo é armazenada em `globalThis` para reutilização entre invocações quentes na Vercel, com pool limitado. O banco é selecionado explicitamente por `MONGODB_DB_NAME` (padrão `temaqui`), independentemente do database informado na URI.

## Limites e pragmatismo

Não há fila interna: o Gateway já oferece retry. Dependências estruturais do serviço de ingestão permitem testes sem banco, sem introduzir repository classes cerimoniais. O banco garante idempotência; checagem prévia isolada seria sujeita a corrida.

## Diagnóstico

Os logs `whatsapp_ingestion.received`, `persisted`, `duplicate` e `ignored_*` permitem confirmar recebimento e persistência e produzir contagens na plataforma de logs. Uma API administrativa não foi criada para evitar expor dados sem um modelo de autenticação administrativa definido.

## Estado operacional

A conexão Atlas e o `ping` administrativo foram confirmados contra o banco `temaqui`. Durante a preparação local, a IP Access List do Atlas está temporariamente aberta para `0.0.0.0/0`. Essa configuração não é apropriada como estado permanente: após definir o ambiente de deploy, deve ser substituída pelos IPs/CIDRs necessários ou por conectividade privada compatível.
