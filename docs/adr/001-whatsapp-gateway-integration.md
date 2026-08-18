# ADR 001 — Integração via Muirakitan WhatsApp Gateway

- Status: aceito
- Data: 2026-08-18

## Contexto

O TemAqui precisa receber mensagens novas de grupos autorizados, mas o ecossistema já possui uma infraestrutura central para WhatsApp.

## Decisão

TemAqui não conecta diretamente ao WhatsApp. Consome eventos HTTP assinados do Muirakitan WhatsApp Gateway e depende somente do contrato do webhook.

## Justificativa

- Isola o domínio econômico da API e das mudanças do Baileys.
- Reutiliza sessões, autenticação, reconexão, retry e backoff centralizados.
- Evita outro coletor e reduz consumo operacional.
- Permite substituir a implementação WhatsApp sem alterar o domínio do TemAqui.

## Consequências positivas

- Menor acoplamento e superfície operacional.
- Um único ponto de gestão de sessões WhatsApp.
- Entrega resiliente e autenticada já disponível.

## Consequências negativas

- Disponibilidade e latência dependem do Gateway.
- Mudanças no contrato exigem coordenação e compatibilidade.
- Retry implica entrega pelo menos uma vez; TemAqui deve ser idempotente.
- O segredo HMAC precisa ser distribuído e rotacionado entre os sistemas.

## Detalhe da assinatura

O Gateway calcula HMAC SHA-256 hexadecimal sobre a string JSON exata enviada no corpo. O TemAqui lê o corpo cru, calcula o HMAC antes de interpretar JSON e compara bytes com `timingSafeEqual`.
