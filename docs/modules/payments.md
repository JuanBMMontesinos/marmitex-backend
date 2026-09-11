# Módulo: Pagamentos & Webhook (`payments`)

O módulo **`payments`** gerencia o ciclo de vida das transações financeiras, a geração de dados para pagamentos instantâneos PIX e o processamento de notificações assíncronas (*webhooks*) enviadas por gateways de pagamento.

---

## 1. Estrutura de Arquivos

```
src/modules/payments/
├── payments.controller.ts   # Handler HTTP para recepção de webhooks
├── payments.repository.ts   # Operações na tabela 'payments' do Supabase
├── payments.routes.ts       # Declaração da rota POST /payments/webhook
├── payments.schema.ts       # Schema Zod para payloads flexíveis de webhook
└── payments.service.ts      # Resolução de IDs de pagamento e avanço de status do pedido
```

---

## 2. Classes e Métodos

### 2.1 `PaymentsController` (`src/modules/payments/payments.controller.ts`)
- `async handleWebhook(request: FastifyRequest, reply: FastifyReply)`:
  - Extrai o corpo da requisição e delega para `paymentsService.processWebhook(payload, rawBody)`.

### 2.2 `PaymentsService` (`src/modules/payments/payments.service.ts`)
- **Dependências Injetadas:**
  - `private readonly paymentsRepository: PaymentsRepository`
  - `private readonly ordersRepository: OrdersRepository`

- **Método `async processWebhook(payload: PaymentWebhookInput, rawBody?: unknown)`:**
  1. Extrai identificadores potenciais (`external_id`, `tx_id` ou `order_id`).
  2. Executa busca no banco de dados via `paymentsRepository.findByExternalId()` ou `findByOrderId()`.
  3. **Compatibilidade Multi-Gateway:** Se o payload for de padrão aninhado (como o do Mercado Pago, que envia `{ data: { id: "12345" } }`), o serviço inspeciona a árvore do `rawBody` para localizar o identificador do recurso.
  4. Caso o pagamento não seja localizado, lança `NotFoundError`.
  5. Atualiza o status do registro de pagamento para `PAID` com data/hora em `paid_at`.
  6. **Avanço Automático de Pedido:** Consulta o pedido associado. Se o status estiver em `PENDING`, atualiza-o automaticamente para `CONFIRMED` e insere um registro em `order_status_history` informando a confirmação via webhook.

### 2.3 `PaymentsRepository` (`src/modules/payments/payments.repository.ts`)
- `createPayment(data)`: Cria a transação de pagamento no banco vinculada ao pedido.
- `findByOrderId(orderId)`: Localiza o pagamento vinculado a um pedido específico.
- `findByExternalId(externalId)`: Localiza o pagamento pelo código externo da transação ou `txId` do PIX.
- `markAsPaid(paymentId)`: Atualiza `status = 'PAID'` e `paid_at = now()` na tabela `payments`.

---

## 3. Formato e Geração do PIX Copia e Cola

Quando um pedido é criado com a opção `payment_method = 'PIX'`, o sistema utiliza o utilitário `src/shared/utils/pix.ts` para gerar a cadeia de caracteres EMV oficial do Banco Central.

### Estrutura do Payload EMV:
- **00 (Payload Format Indicator):** `01`
- **26 (Merchant Account Information):**
  - Subcampo `00`: `br.gov.bcb.pix`
  - Subcampo `01`: Chave PIX cadastrada nas configurações da marmitaria.
  - Subcampo `02`: Descrição opcional da transação (ex: `"Marmitaria Pedido #1042"`).
- **52 (Merchant Category Code):** `0000`
- **53 (Transaction Currency):** `986` (BRL)
- **54 (Transaction Amount):** Valor com 2 casas decimais (ex: `"32.00"`).
- **58 (Country Code):** `BR`
- **59 (Merchant Name):** Razão Social / Nome do Restaurante (sem caracteres especiais, máx. 25 caracteres).
- **60 (Merchant City):** Cidade do estabelecimento (máx. 15 caracteres).
- **62 (Additional Data Field Template):**
  - Subcampo `05` (Reference Label / txId): Identificador único (ex: `"PEDIDO1042"`).
- **63 (CRC16 Checksum):** Polinômio `0x1021` com valor inicial `0xFFFF`, calculado sobre toda a cadeia anterior precedida de `"6304"`.

---

## 4. Integração com Gateways Externos

Para integrar com gateways como Mercado Pago, Asaas, PagSeguro ou Efí:

1. Configure a URL de Webhook no painel do gateway apontando para:
   ```
   https://marmitex-backend.vercel.app/api/v1/payments/webhook
   ```
2. Ao gerar a cobrança no gateway, defina o campo `external_reference` ou `txId` com o valor retornado em `order.payment.tx_id` (ex: `"PEDIDO1042"`).
3. Quando a notificação for entregue, o backend localizará o pedido instantaneamente e atualizará o status da cozinha de `PENDING` para `CONFIRMED`.
