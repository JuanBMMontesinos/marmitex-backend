# Referência Completa da API REST

Esta é a especificação exaustiva de todos os endpoints HTTP expostos pela **Marmitex Backend API**.

- **URL Base de Produção:** `https://marmitex-backend.vercel.app/api/v1`
- **URL Base de Desenvolvimento Local:** `http://localhost:3333/api/v1`
- **Documentação Interativa (Swagger UI):** `/docs`
- **Formato das Mensagens:** `application/json; charset=utf-8`

---

## 1. Endpoints de Sistema & Diagnóstico

### 1.1 `GET /health`
Verifica se a instância da API está operacional e responde a requisições.

- **Autenticação:** Nenhuma
- **Status Code:** `200 OK`
- **Exemplo de Resposta:**
  ```json
  {
    "status": "OK",
    "service": "marmitex-backend",
    "timestamp": "2026-09-11T01:50:04.985Z",
    "uptime": 270.92
  }
  ```

### 1.2 `GET /`
Redireciona automaticamente (`302 Found`) para a interface gráfica interativa do Swagger em `/docs`.

---

## 2. Módulo de Cardápio (`menu`)

### 2.1 `GET /api/v1/menu/today`
Retorna o cardápio específico para a data de hoje, considerando o fuso horário oficial de Brasília (`America/Sao_Paulo`).

- **Query Params:** Nenhum
- **Status Code:** `200 OK`
- **Comportamento no Domingo:** Retorna `is_open: false`, pratos vazios e mensagem explicativa.
- **Exemplo de Resposta:**
  ```json
  {
    "day_of_week": "QUARTA",
    "day_name": "Quarta-feira",
    "is_open": true,
    "dishes": [
      {
        "id": "18f1a238-d6b0-466a-b28a-7d4d38e2d4cf",
        "category": "PRATO_DO_DIA",
        "day_of_week": "QUARTA",
        "option_label": "1ª Opção",
        "name": "Feijoada Completa",
        "ingredients": "Arroz, feijoada magra, couve refogada, farofa da casa, vinagrete e bisteca",
        "has_salad": true,
        "price": 24.00,
        "image_url": "https://rotfaginjjtdodavljes.supabase.co/storage/v1/object/public/menu/feijoada.jpg",
        "is_available": true,
        "display_order": 1
      }
    ],
    "beverages": [
      {
        "id": "27b4b455-89f5-449e-bdf1-eef1b32dca91",
        "category": "BEBIDA",
        "day_of_week": "TODOS_OS_DIAS",
        "option_label": null,
        "name": "Coca-Cola Lata 350ml",
        "ingredients": null,
        "has_salad": false,
        "price": 6.00,
        "image_url": null,
        "is_available": true,
        "display_order": 10
      }
    ],
    "addons": [
      {
        "id": "67cfc0a2-2b21-4f18-a6d1-4114fcfb790d",
        "name": "Ovo Frito Extra",
        "price": 3.00,
        "is_available": true,
        "display_order": 1
      }
    ]
  }
  ```

### 2.2 `GET /api/v1/menu/weekly`
Retorna a programação de pratos para a semana inteira (Segunda a Sábado), além de bebidas e adicionais. Utilizado pelo aplicativo para navegação e planejamento prévio do cliente.

- **Query Params:** Nenhum
- **Status Code:** `200 OK`
- **Exemplo de Resposta:**
  ```json
  {
    "weekly_schedule": [
      {
        "day_of_week": "SEGUNDA",
        "day_name": "Segunda-feira",
        "dishes": [ /* itens de segunda */ ]
      },
      {
        "day_of_week": "TERCA",
        "day_name": "Terça-feira",
        "dishes": [ /* itens de terça */ ]
      }
      /* até SABADO */
    ],
    "beverages": [ /* bebidas disponíveis */ ],
    "addons": [ /* adicionais */ ]
  }
  ```

---

## 3. Módulo de Configurações (`settings`)

### 3.1 `GET /api/v1/settings`
Consulta informações cadastrais, canais de atendimento, chave PIX e estado operacional atual da marmitaria.

- **Status Code:** `200 OK`
- **Exemplo de Resposta:**
  ```json
  {
    "id": 1,
    "name": "Marmitaria do Dia",
    "is_open": true,
    "opening_time": "11:00",
    "closing_time": "14:30",
    "phone_whatsapp": "11999999999",
    "pix_key": "contato@marmitariadodia.com.br",
    "address_text": "Rua Principal, 123 - Centro",
    "takeout_open_time": "11:00",
    "currently_open": true
  }
  ```
- **Regra de Negócio `currently_open`:**
  Retorna `true` se e somente se:
  1. O campo `is_open` manual do banco for `true`.
  2. O dia atual em São Paulo não for Domingo (`DOMINGO`).
  3. A hora atual em São Paulo estiver estritamente entre `opening_time` e `closing_time`.

---

## 4. Módulo de Zonas de Entrega (`delivery-zones`)

### 4.1 `GET /api/v1/delivery-zones`
Lista todos os bairros homologados para entrega, com seus respectivos valores de frete e prazos estimados.

- **Status Code:** `200 OK`
- **Exemplo de Resposta:**
  ```json
  [
    {
      "id": "e0b57e4b-6f77-4be7-ba88-348f3ca85a3c",
      "neighborhood": "Centro",
      "delivery_fee": 5.00,
      "estimated_time_min": 35,
      "is_active": true
    },
    {
      "id": "a918f1a8-8f81-424a-9b1b-198129bbcf21",
      "neighborhood": "Jardins",
      "delivery_fee": 8.00,
      "estimated_time_min": 45,
      "is_active": true
    }
  ]
  ```

---

## 5. Módulo de Pedidos (`orders`)

### 5.1 `POST /api/v1/orders`
Cria um novo pedido com validação estrita no servidor (subtotal, frete, itens disponíveis e adicionais). Se a forma de pagamento for `PIX`, gera instantaneamente a chave e a cadeia de caracteres PIX Copia e Cola no padrão EMV do Bacen.

- **Headers:** `Content-Type: application/json`
- **Status Code:** `200 OK` (ou `201 Created`)
- **Exemplo de Payload de Requisição (Entrega com PIX):**
  ```json
  {
    "customer": {
      "full_name": "Maria Silva",
      "phone": "11988887777"
    },
    "delivery_type": "DELIVERY",
    "address": {
      "street": "Rua das Flores",
      "number": "100",
      "complement": "Apto 42",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zip_code": "01001-000",
      "reference_point": "Próximo à padaria"
    },
    "payment_method": "PIX",
    "need_change": false,
    "notes": "Por favor, tocar o interfone 42",
    "items": [
      {
        "menu_item_id": "18f1a238-d6b0-466a-b28a-7d4d38e2d4cf",
        "quantity": 1,
        "has_salad": true,
        "preferences": "Caprichar no feijão",
        "addon_ids": [
          "67cfc0a2-2b21-4f18-a6d1-4114fcfb790d"
        ]
      }
    ]
  }
  ```

- **Exemplo de Resposta de Sucesso:**
  ```json
  {
    "id": "d51f28b4-93be-4be9-97bc-b9e782d1c5a1",
    "order_number": 1042,
    "order_number_formatted": "#1042",
    "status": "PENDING",
    "delivery_type": "DELIVERY",
    "payment_method": "PIX",
    "subtotal": 27.00,
    "delivery_fee": 5.00,
    "discount": 0.00,
    "total_amount": 32.00,
    "customer": {
      "id": "f2905307-5374-4b52-b883-fa342b5d49ec",
      "name": "Maria Silva",
      "phone": "11988887777"
    },
    "payment": {
      "id": "e672ad61-cb72-463e-ae89-08a6e5108604",
      "status": "PENDING",
      "provider": "PIX_BACEN",
      "qr_code_pix": "00020126480014br.gov.bcb.pix0126contato@marmitariadodia.com.br520400005303986540532.005802BR5918MARMITARIA DO DIA6009SAO PAULO62160512PEDIDO1042630489A1",
      "pix_key": "contato@marmitariadodia.com.br",
      "tx_id": "PEDIDO1042"
    }
  }
  ```

### 5.2 `GET /api/v1/orders/:id`
Consulta detalhes completos do pedido pelo UUID. Utilizado pela tela de acompanhamento em tempo real do app e pelo painel da cozinha.

- **Parâmetros de Rota:** `id` (UUID v4)
- **Status Code:** `200 OK`
- **Exemplo de Resposta:**
  ```json
  {
    "id": "d51f28b4-93be-4be9-97bc-b9e782d1c5a1",
    "order_number": 1042,
    "order_number_formatted": "#1042",
    "status": "CONFIRMED",
    "delivery_type": "DELIVERY",
    "takeout_time": null,
    "payment_method": "PIX",
    "need_change": false,
    "change_for": null,
    "notes": "Por favor, tocar o interfone 42",
    "subtotal": 27.00,
    "delivery_fee": 5.00,
    "discount": 0.00,
    "total_amount": 32.00,
    "created_at": "2026-09-11T02:00:00.000Z",
    "updated_at": "2026-09-11T02:05:00.000Z",
    "customer": {
      "id": "f2905307-5374-4b52-b883-fa342b5d49ec",
      "full_name": "Maria Silva",
      "phone": "11988887777"
    },
    "address": {
      "id": "8fa886f3-f542-4fce-bc0b-d2426913e71d",
      "street": "Rua das Flores",
      "number": "100",
      "complement": "Apto 42",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zip_code": "01001-000",
      "reference_point": "Próximo à padaria"
    },
    "items": [
      {
        "id": "item-uuid-1",
        "menu_item_id": "18f1a238-d6b0-466a-b28a-7d4d38e2d4cf",
        "item_name": "Feijoada Completa",
        "option_label": "1ª Opção",
        "day_name": "QUARTA",
        "has_salad": true,
        "quantity": 1,
        "unit_price": 24.00,
        "preferences": "Caprichar no feijão",
        "total_price": 27.00,
        "addons": [
          {
            "id": "67cfc0a2-2b21-4f18-a6d1-4114fcfb790d",
            "name": "Ovo Frito Extra",
            "price": 3.00
          }
        ]
      }
    ],
    "payment": {
      "id": "e672ad61-cb72-463e-ae89-08a6e5108604",
      "provider": "PIX_BACEN",
      "status": "PAID",
      "qr_code_pix": "000201...",
      "paid_at": "2026-09-11T02:05:00.000Z"
    },
    "status_history": [
      {
        "id": "history-uuid-1",
        "from_status": null,
        "to_status": "PENDING",
        "notes": "Pedido criado com sucesso pelo cliente",
        "created_at": "2026-09-11T02:00:00.000Z"
      },
      {
        "id": "history-uuid-2",
        "from_status": "PENDING",
        "to_status": "CONFIRMED",
        "notes": "Pagamento confirmado automaticamente via Webhook do Gateway",
        "created_at": "2026-09-11T02:05:00.000Z"
      }
    ]
  }
  ```

### 5.3 `PATCH /api/v1/orders/:id/status`
Atualiza o status operacional do pedido. Usado pelo painel da cozinha (KDS) ou pelos entregadores.

- **Parâmetros de Rota:** `id` (UUID v4)
- **Payload de Requisição:**
  ```json
  {
    "status": "IN_PREPARATION",
    "notes": "Iniciado preparo das marmitas na cozinha"
  }
  ```
- **Status Permitidos:**
  `PENDING`, `CONFIRMED`, `IN_PREPARATION`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELED`.
- **Status Code:** `200 OK`
- **Exemplo de Resposta:**
  ```json
  {
    "id": "d51f28b4-93be-4be9-97bc-b9e782d1c5a1",
    "order_number": 1042,
    "order_number_formatted": "#1042",
    "previous_status": "CONFIRMED",
    "current_status": "IN_PREPARATION",
    "updated_at": "2026-09-11T02:10:00.000Z"
  }
  ```

---

## 6. Módulo de Pagamentos & Webhook (`payments`)

### 6.1 `POST /api/v1/payments/webhook`
Recebe notificações assíncronas enviadas por gateways de pagamento (Mercado Pago, Asaas, Efí, Itaú, etc.). O sistema localiza o pagamento pelo `external_id` (txId), atualiza a transação para `PAID` e, caso o pedido esteja em `PENDING`, atualiza-o automaticamente para `CONFIRMED`.

- **Headers:** `Content-Type: application/json`
- **Payload de Exemplo:**
  ```json
  {
    "event": "payment.approved",
    "tx_id": "PEDIDO1042",
    "status": "paid"
  }
  ```
- **Status Code:** `200 OK`
- **Exemplo de Resposta:**
  ```json
  {
    "success": true,
    "message": "Pagamento confirmado e pedido atualizado para CONFIRMED com sucesso.",
    "order_id": "d51f28b4-93be-4be9-97bc-b9e782d1c5a1",
    "order_number": 1042,
    "payment_status": "PAID"
  }
  ```
