# Marmitex Backend API 🍲🛵

Backend RESTful de alta performance desenvolvido em **Node.js**, **TypeScript** e **Fastify**, projetado para alimentar o aplicativo Android de clientes (**"Marmitaria do Dia"**) e o painel web da cozinha (**Backoffice**).

A aplicação se conecta diretamente ao banco de dados PostgreSQL hospedado no **Supabase** via Service Role, sem necessidade de migrations locais adicionais.

> 📚 **Documentação Técnica Completa:**
> Consulte o [Índice da Documentação Técnica (docs/)](./docs/index.md) para a especificação exaustiva de arquitetura, dicionário de dados, variáveis de ambiente, módulos e o [Contexto Consolidado para IAs e Android Studio](./docs/ai-context.md).

---

## 🚀 1. Stack Tecnológica

- **Linguagem:** Node.js (v20+ / v24+) com TypeScript estrito (`strict: true`)
- **Framework Web:** [Fastify](https://fastify.dev/) (arquitetura ultra-rápida de baixa latência)
- **Banco de Dados:** PostgreSQL hospedado no [Supabase](https://supabase.com/) (`@supabase/supabase-js`)
- **Validação de Payloads e Variáveis:** [Zod](https://zod.dev/) & `fastify-type-provider-zod`
- **Documentação da API:** Swagger / OpenAPI 3.0 (`@fastify/swagger` + `@fastify/swagger-ui`)
- **Gerador de PIX:** Implementação nativa do padrão EMV QRCPS-MPM do Banco Central (PIX Copia e Cola com cálculo de CRC16)
- **Compilação e Dev Server:** `tsx` para desenvolvimento e `tsup` para build de produção ultra-rápido

---

## 📁 2. Estrutura do Projeto (Clean / Layered Architecture)

```
marmitex-backend/
├── src/
│   ├── config/                      # Variáveis de ambiente validadas com Zod
│   │   ├── env.ts
│   │   └── index.ts
│   ├── database/                    # Conexão e tipagem do Supabase
│   │   ├── supabase.ts              # Singleton do cliente Supabase (Service Role)
│   │   └── types.ts                 # Interfaces TypeScript das tabelas existentes
│   ├── shared/                      # Recursos compartilhados e transversais
│   │   ├── errors/
│   │   │   ├── app-error.ts         # Classes de erro (NotFoundError, BadRequestError, etc.)
│   │   │   └── error-handler.ts     # Middleware global de tratamento de erros
│   │   └── utils/
│   │       ├── date.ts              # Regras de fuso horário (America/Sao_Paulo) e dias da semana
│   │       └── pix.ts               # Gerador de payload PIX Copia e Cola / BR Code
│   ├── modules/                     # Módulos de domínio
│   │   ├── menu/                    # Cardápio do dia e semanal
│   │   │   ├── menu.schema.ts
│   │   │   ├── menu.repository.ts
│   │   │   ├── menu.service.ts
│   │   │   ├── menu.controller.ts
│   │   │   └── menu.routes.ts
│   │   ├── settings/                # Configurações do restaurante e horários
│   │   │   ├── settings.schema.ts
│   │   │   ├── settings.repository.ts
│   │   │   ├── settings.service.ts
│   │   │   ├── settings.controller.ts
│   │   │   └── settings.routes.ts
│   │   ├── delivery-zones/          # Bairros atendidos e cálculo de frete
│   │   │   ├── delivery-zone.schema.ts
│   │   │   ├── delivery-zone.repository.ts
│   │   │   ├── delivery-zone.service.ts
│   │   │   ├── delivery-zone.controller.ts
│   │   │   └── delivery-zone.routes.ts
│   │   ├── orders/                  # Checkout, criação, cálculo de preço e histórico
│   │   │   ├── orders.schema.ts
│   │   │   ├── orders.repository.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── orders.controller.ts
│   │   │   └── orders.routes.ts
│   │   └── payments/                # Webhook e transações de pagamento
│   │       ├── payments.schema.ts
│   │       ├── payments.repository.ts
│   │       ├── payments.service.ts
│   │       ├── payments.controller.ts
│   │       └── payments.routes.ts
│   ├── app.ts                       # Montagem de plugins, CORS, Swagger e rotas
│   └── server.ts                    # Inicialização e encerramento gracioso (graceful shutdown)
├── .env.example                     # Exemplo de configuração de ambiente
├── .env                             # Arquivo local com as variáveis de ambiente
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ 3. Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js 20 ou superior
- npm instalado
- Projeto Supabase com as tabelas criadas

### Passo 1: Clonar ou Acessar o Diretório
```bash
cd marmitex-backend
```

### Passo 2: Instalar Dependências
```bash
npm install
```

### Passo 3: Configurar Variáveis de Ambiente
Copie o arquivo de exemplo `.env.example` para `.env`:
```bash
cp .env.example .env
```
Abra o `.env` e preencha as credenciais do seu projeto Supabase:
```env
PORT=3333
HOST=0.0.0.0
NODE_ENV=development

# Credenciais obtidas no Supabase (Project Settings -> API)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

CORS_ORIGIN=*
```

### Passo 4: Executar em Modo de Desenvolvimento
```bash
npm run dev
```
O servidor será iniciado em `http://localhost:3333` com hot-reload ativo.

### Passo 5: Build para Produção
```bash
npm run build
npm start
```

---

## 📖 4. Documentação Interativa (Swagger / OpenAPI)

Com o servidor rodando, acesse a documentação interativa em:
👉 **[http://localhost:3333/docs](http://localhost:3333/docs)**

A documentação inclui schemas, exemplos de payloads e permite testar as requisições diretamente pelo navegador.

---

## 📡 5. Endpoints da API

Todos os endpoints da API estão versionados sob o prefixo `/api/v1`.

### A. Cardápio & Configurações

#### 1. Cardápio de Hoje
- **Rota:** `GET /api/v1/menu/today`
- **Descrição:** Detecta o dia da semana atual no fuso horário de São Paulo (`America/Sao_Paulo`). Se for domingo, retorna `is_open: false` com mensagem de fechado. Retorna pratos do dia (1ª a 6ª opção), bebidas e adicionais disponíveis.
- **Exemplo de Resposta:**
```json
{
  "day_of_week": "SEGUNDA",
  "day_name": "Segunda-feira",
  "is_open": true,
  "dishes": [
    {
      "id": "c1f728c3-cda8-4444-9fa0-1d8fa9f2ef01",
      "category": "PRATO_DO_DIA",
      "day_of_week": "SEGUNDA",
      "option_label": "1ª Opção",
      "name": "Bife a Rolê com Purê",
      "ingredients": "Arroz, feijão carioca, bife bovino enrolado com cenoura e bacon, purê de batata.",
      "has_salad": true,
      "price": 28.00,
      "image_url": "https://...",
      "is_available": true,
      "display_order": 1
    }
  ],
  "beverages": [
    {
      "id": "e9b21f30-f8dc-4ec3-a6aa-8367a783da89",
      "category": "BEBIDA",
      "name": "Coca-Cola 350ml",
      "price": 6.00,
      "is_available": true
    }
  ],
  "addons": [
    {
      "id": "6df989b1-591a-4d2c-a22b-58661fc93175",
      "name": "Ovo Frito",
      "price": 3.00,
      "is_available": true
    }
  ]
}
```

#### 2. Cardápio Semanal
- **Rota:** `GET /api/v1/menu/weekly`
- **Descrição:** Retorna todo o cardápio da semana agrupado de Segunda a Sábado para consulta prévia no app.

#### 3. Configurações do Restaurante
- **Rota:** `GET /api/v1/settings`
- **Descrição:** Retorna dados de contato, chave PIX cadastrada, horários de abertura e fechamento, e o status calculado em tempo real se o restaurante está aceitando pedidos.

#### 4. Zonas e Taxas de Entrega
- **Rota:** `GET /api/v1/delivery-zones`
- **Descrição:** Retorna a listagem de bairros atendidos com suas respectivas taxas de entrega e tempo estimado.

---

### B. Pedidos & Checkout

#### 1. Criar Pedido
- **Rota:** `POST /api/v1/orders`
- **Regras:**
  - Valida todos os itens e adicionais no banco de dados.
  - **Cálculo de Preço no Servidor:** O frontend não dita o valor total; o backend calcula: `(Preço do Prato + Soma dos Adicionais) * Quantidade + Taxa de Entrega`.
  - Validação estrita do bairro informado para entregas (`DELIVERY`).
  - Se `payment_method = 'PIX'`, gera a linha digitável do PIX Copia e Cola (padrão Bacen) e registra na tabela `payments`.
  - Registra histórico de status inicial em `order_status_history`.
- **Exemplo de Payload:**
```json
{
  "customer": {
    "full_name": "Maria Silva",
    "phone": "11988887777"
  },
  "delivery_type": "DELIVERY",
  "address": {
    "street": "Rua das Flores",
    "number": "150",
    "complement": "Apto 21",
    "neighborhood": "Vila Mariana",
    "city": "São Paulo",
    "state": "SP",
    "reference_point": "Próximo à padaria"
  },
  "items": [
    {
      "menu_item_id": "c1f728c3-cda8-4444-9fa0-1d8fa9f2ef01",
      "quantity": 1,
      "has_salad": true,
      "preferences": "Feijão por cima do arroz e bife bem passado",
      "addon_ids": ["6df989b1-591a-4d2c-a22b-58661fc93175"]
    }
  ],
  "payment_method": "PIX",
  "notes": "Tocar o interfone 21"
}
```
- **Exemplo de Resposta:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "order_number": 1001,
  "order_number_formatted": "#1001",
  "status": "PENDING",
  "delivery_type": "DELIVERY",
  "payment_method": "PIX",
  "subtotal": 31.00,
  "delivery_fee": 5.00,
  "discount": 0.00,
  "total_amount": 36.00,
  "customer": {
    "id": "110e8400-e29b-41d4-a716-446655440001",
    "name": "Maria Silva",
    "phone": "11988887777"
  },
  "payment": {
    "id": "220e8400-e29b-41d4-a716-446655440002",
    "status": "PENDING",
    "provider": "PIX_BACEN",
    "qr_code_pix": "00020126480014br.gov.bcb.pix0126contato@marmitariadodia.com.br520400005303986540536.005802BR5917MARMITARIA DO DIA6009SAO PAULO62140510PEDIDO1001630489A1",
    "pix_key": "contato@marmitariadodia.com.br",
    "tx_id": "PEDIDO1001"
  }
}
```

#### 2. Obter Detalhes do Pedido
- **Rota:** `GET /api/v1/orders/:id`
- **Descrição:** Retorna os detalhes completos do pedido: dados do cliente, endereço, itens com seus adicionais, pagamento e linha do tempo de status (`status_history`).

#### 3. Atualizar Status do Pedido (Backoffice / Cozinha)
- **Rota:** `PATCH /api/v1/orders/:id/status`
- **Descrição:** Atualiza o status do pedido e registra automaticamente uma entrada na tabela `order_status_history`.
- **Exemplo de Payload:**
```json
{
  "status": "IN_PREPARATION",
  "notes": "Marmita sendo montada pela cozinha"
}
```
- **Fluxo de Status Recomendado:**
  1. `PENDING` (Aguardando confirmação ou pagamento PIX)
  2. `CONFIRMED` (Confirmado pela cozinha / Pago)
  3. `IN_PREPARATION` (Em preparo na cozinha)
  4. `OUT_FOR_DELIVERY` (Saiu para entrega)
  5. `DELIVERED` (Entregue ao cliente)
  6. `CANCELED` (Cancelado)

---

### C. Pagamento & Webhook

#### 1. Webhook de Confirmação de Pagamento
- **Rota:** `POST /api/v1/payments/webhook`
- **Descrição:** Recebe notificações assíncronas do Gateway de Pagamento (Mercado Pago, Asaas, etc.). Localiza a transação pelo ID externo ou ID do pedido, atualiza a tabela `payments` para `PAID` (registrando `paid_at`) e transiciona automaticamente o pedido associado de `PENDING` para `CONFIRMED`.
- **Exemplo de Payload:**
```json
{
  "event": "PAYMENT_RECEIVED",
  "external_id": "PEDIDO1001",
  "status": "PAID"
}
```

---

## 🛡️ 6. Tratamento de Erros

A API conta com um middleware centralizado de erros em `src/shared/errors/error-handler.ts`:
- Erros de validação Zod retornam status `400` com detalhamento amigável dos campos incorretos.
- Recursos não encontrados disparam `404` (`NotFoundError`).
- Tentativas de entrega em bairros não cadastrados disparam `400` (`BadRequestError`).
- Erros inesperados retornam `500` formatados sem vazar stack trace em ambiente de produção.

---

## 📱 7. Integração com o Aplicativo Android & Backoffice Web

### URLs Oficiais de Produção (Vercel):
- **Base URL da API:** `https://marmitex-backend.vercel.app/api/v1/`
- **Swagger / OpenAPI 3.0:** `https://marmitex-backend.vercel.app/docs`
- **Health Check:** `https://marmitex-backend.vercel.app/health`

### Configuração no Android Studio (Kotlin / Retrofit):
Altere a `BASE_URL` no seu cliente de rede:
```kotlin
object NetworkConfig {
    const val BASE_URL = "https://marmitex-backend.vercel.app/api/v1/"
}
```

### Configuração no Painel Web (Backoffice):
No arquivo `.env` do seu frontend web (React / Vite):
```env
VITE_API_URL=https://marmitex-backend.vercel.app/api/v1
```

