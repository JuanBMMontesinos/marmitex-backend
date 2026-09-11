# Documentação Técnica - Marmitex Backend 🍲🛵

Bem-vindo à documentação técnica oficial da **Marmitex Backend API**. Este documento foi elaborado tanto para engenheiros de software quanto para agentes de inteligência artificial (LLMs / AI Assistants) que precisam consultar, estender ou integrar clientes (como o aplicativo móvel Android e o painel web da cozinha).

---

## 📌 Sumário da Documentação

| Documento | Descrição |
|---|---|
| [1. Arquitetura do Sistema](./architecture.md) | Arquitetura em camadas (*Clean / Layered*), ciclo de vida do Fastify e execução híbrida (Node nativo e Serverless Vercel). |
| [2. Dicionário do Banco de Dados (Supabase)](./database-schema.md) | Mapeamento relacional completo das 11 tabelas, tipos, enums, restrições e relacionamentos do PostgreSQL. |
| [3. Variáveis de Ambiente & Configuração](./environment-variables.md) | Especificação das variáveis, validação com Zod, defaults, sanitizações automáticas e boas práticas de segurança. |
| [4. Referência Completa da API REST](./api-reference.md) | Especificação exaustiva de todos os endpoints HTTP (payloads de requisição, respostas, status codes e exemplos). |
| [5. Módulo: Cardápio (`menu`)](./modules/menu.md) | Detalhamento de classes, métodos, regras de dia da semana (fuso de SP) e montagem do cardápio. |
| [6. Módulo: Configurações (`settings`)](./modules/settings.md) | Horários de funcionamento, cálculo de restaurante aberto/fechado e dados de contato. |
| [7. Módulo: Zonas de Entrega (`delivery-zones`)](./modules/delivery-zones.md) | Consulta de bairros atendidos, taxas de frete e tempos estimados de entrega. |
| [8. Módulo: Pedidos & Checkout (`orders`)](./modules/orders.md) | Validação estrita de preços no servidor, máquina de estados de pedidos e auditoria de histórico. |
| [9. Módulo: Pagamentos & Webhook (`payments`)](./modules/payments.md) | Integração de pagamentos, geração de PIX Copia e Cola (Bacen EMV) e processamento de webhooks. |
| [10. Utilitários Compartilhados (`shared`)](./shared-utilities.md) | Fuso horário de São Paulo, gerador de CRC16 para PIX e tratamento centralizado de erros. |
| [11. Contexto para Inteligência Artificial (`ai-context.md`)](./ai-context.md) | Resumo estruturado com contratos de dados pronto para prompt injection em IAs (Android Studio, Copilot, etc.). |

---

## 🛠️ Stack Tecnológica & Versões

- **Runtime:** Node.js `>= 20.0.0` (suporte a Node 22 e 24)
- **Linguagem:** TypeScript `5.8+` com tipagem estrita (`"strict": true`)
- **Framework Web:** Fastify `5.2+`
- **Validação:** Zod `3.24+` com integração direta via `fastify-type-provider-zod`
- **Banco de Dados:** PostgreSQL hospedado no Supabase, acessado via `@supabase/supabase-js 2.49+` (Service Role)
- **Documentação de API:** OpenAPI 3.0 via `@fastify/swagger 9.4+` e `@fastify/swagger-ui 5.2+`
- **Bundler de Produção:** `tsup 8.4+` (baseado em esbuild)
- **Ambiente em Produção:** Vercel Serverless Functions (`api/index.js`) e compatibilidade nativa com containers/Node (`dist/server.js`)

---

## 🧭 Princípios de Design

1. **Segurança de Preços:** O front-end (cliente) nunca dita valores monetários. Todo cálculo de subtotal, adicionais e taxa de entrega é recalculado e validado no servidor consultando a fonte da verdade no Supabase.
2. **Localização Temporal Estrita:** Regras de negócio de "prato do dia" e horário de funcionamento são fixadas no fuso horário oficial de Brasília (`America/Sao_Paulo`).
3. **Resiliência e Autocontenção:** O backend possui tratamento de contingência (fallback) caso registros de configuração não existam ou conexões temporárias oscilem.
4. **Sem Migrations Locais:** O banco de dados já está hospedado e modelado no Supabase. O backend consome e manipula as tabelas existentes de forma tipada e segura.
