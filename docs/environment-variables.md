# Variáveis de Ambiente & Configuração

Este documento detalha todas as variáveis de ambiente necessárias para a execução do **Marmitex Backend API**, seu processo de validação em tempo de inicialização (*startup validation*), regras de sanitização automática e diretrizes de configuração local e em produção (Vercel).

---

## 1. Validação com Zod (`src/config/env.ts`)

A aplicação adota o princípio de **Falha Rápida (*Fail-Fast*)**: se qualquer variável obrigatória estiver ausente ou malformatada, o processo não inicializa e exibe um relatório detalhado das inconsistências no console.

```typescript
const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  HOST: z
    .string()
    .default('0.0.0.0')
    .transform((val) => (val === '127.0.0.0' ? '0.0.0.0' : val)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z
    .string()
    .url('SUPABASE_URL deve ser uma URL válida')
    .transform((url) => url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY é obrigatória'),
  CORS_ORIGIN: z.string().default('*'),
});
```

---

## 2. Dicionário das Variáveis

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição & Regras de Validação |
|---|---|---|---|---|
| `PORT` | `number` | Não | `3333` | Porta TCP em que o servidor Fastify escutará no modo nativo (`node dist/server.js`). Ignorada no ambiente Vercel Serverless. |
| `HOST` | `string` | Não | `'0.0.0.0'` | Endereço de interface de rede. Possui transformação automática que converte `'127.0.0.0'` para `'0.0.0.0'`, prevenindo erros de bind em redes locais e Docker. |
| `NODE_ENV` | `enum` | Não | `'development'` | Ambiente de execução: `'development'`, `'production'` ou `'test'`. Controla nível de log do Fastify (`info` em prod, `debug` em dev) e verbosidade de erros 500. |
| `SUPABASE_URL` | `string (url)` | **Sim** | - | URL base do projeto Supabase (ex: `https://xyz.supabase.co`). Possui transformação Zod que remove automaticamente o sufixo `/rest/v1` caso seja colado por engano. |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | **Sim** | - | Chave secreta de serviço (*Service Role Key*) do Supabase. Permite acesso irrestrito às tabelas para executar operações do backend com máxima performance. |
| `CORS_ORIGIN` | `string` | Não | `'*'` | Origens permitidas para requisições CORS. Pode ser `'*'` para acesso público total ou lista separada por vírgulas (ex: `https://meuapp.com,https://painel.com`). |

---

## 3. Comportamento de Sanitização Automática

O Zod realiza transformações automáticas no momento do parse:

1. **Correção de URL do Supabase:**
   - Se o usuário configurar `https://rotfaginjjtdodavljes.supabase.co/rest/v1/`, o parser Zod trunca para `https://rotfaginjjtdodavljes.supabase.co`. Isso evita falhas de rota na biblioteca `@supabase/supabase-js`.
2. **Correção de Host Local:**
   - Se `HOST` for definido como `127.0.0.0`, é normalizado para `0.0.0.0`, permitindo que outros dispositivos na rede local (incluindo o emulador Android ou celular físico via Wi-Fi) consigam acessar a API.
3. **Coerção de Tipo para Porta:**
   - Valores em string como `"3333"` são automaticamente convertidos para o número `3333`.

---

## 4. Arquivo `.env` para Desenvolvimento Local

Crie um arquivo `.env` na raiz do projeto com o seguinte modelo:

```env
# Servidor
PORT=3333
HOST=0.0.0.0
NODE_ENV=development

# Supabase
SUPABASE_URL=https://rotfaginjjtdodavljes.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# CORS
CORS_ORIGIN=*
```

---

## 5. Diretrizes Críticas para a Vercel (Produção)

Ao configurar variáveis de ambiente no painel da Vercel (**Project Settings -> Environment Variables**), atente-se às seguintes regras essenciais:

> [!IMPORTANT]
> **`SUPABASE_URL` deve ser salva como texto puro (Config), e NÃO como Secret mascarado!**
> Se a `SUPABASE_URL` for salva com a proteção de mascaramento ativada na Vercel, o Vercel pode retornar uma URL fictícia (`https://aBcDe.supabase.co`) durante a execução, causando erro de DNS `ENOTFOUND` ao tentar se comunicar com o banco de dados.

> [!CAUTION]
> **`SUPABASE_SERVICE_ROLE_KEY` NUNCA deve ser exposta no front-end.**
> Ela concede permissões completas de leitura e escrita ao banco de dados, ignorando Row Level Security (RLS). Apenas o backend serverless e os servidores internos devem possuir essa chave.
