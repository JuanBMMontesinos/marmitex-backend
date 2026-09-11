# Contexto Técnico Consolidado para Inteligências Artificiais (AI Context)

> **AVISO PARA AGENTES DE IA (Gemini, Claude, GPT, Cursor, Copilot, Android Studio Assistant):**
> Este documento é uma referência de alta densidade informativa do backend **Marmitex API**. Ao projetar clientes (aplicativo Android Kotlin/Compose, painel web React/Vue ou integrações de terceiros), utilize os contratos de dados e regras de negócio descritos abaixo como **verdade absoluta**.

---

## 1. Identificação do Serviço & Endpoints Base

- **Produção (Vercel):** `https://marmitex-backend.vercel.app`
- **Prefixo da API v1:** `/api/v1`
- **URL Base Completa:** `https://marmitex-backend.vercel.app/api/v1/`
- **Swagger / OpenAPI:** `https://marmitex-backend.vercel.app/docs`
- **Health Check:** `https://marmitex-backend.vercel.app/health`
- **Local Dev:** `http://localhost:3333/api/v1/` (emulador Android usa `http://10.0.2.2:3333/api/v1/`)

---

## 2. Regras Fundamentais de Arquitetura & Segurança

1. **Preços Confiáveis (Server-Calculated Prices):**
   - O cliente front-end **nunca** calcula nem envia preços monetários na criação do pedido.
   - O cliente envia apenas IDs dos pratos, quantidades e IDs dos adicionais.
   - O backend recalcula e valida `subtotal`, `delivery_fee` e `total_amount` consultando o PostgreSQL no Supabase.
2. **Localização Temporal (Brasília / São Paulo):**
   - Horários de funcionamento e prato do dia são calculados estritamente no fuso `America/Sao_Paulo`.
   - Aos domingos o restaurante retorna `is_open: false` e pratos vazios.
3. **Formas de Pagamento Homologadas:**
   - `PIX`, `CREDIT_CARD`, `CASH_ON_DELIVERY`, `CARD_ON_DELIVERY`.
4. **Tipos de Entrega:**
   - `DELIVERY` (requer `address` com bairro homologado em `delivery_zones`).
   - `TAKEOUT` (retirada no balcão, frete fixado em R$ 0,00).

---

## 3. Contratos de Dados (DTOs & JSON Schemas)

### 3.1 Cardápio (`GET /menu/today` & `GET /menu/weekly`)

#### DTO do Item do Cardápio (`MenuItemDto`)
```json
{
  "id": "uuid (string)",
  "category": "PRATO_DO_DIA | BEBIDA",
  "day_of_week": "SEGUNDA | TERCA | QUARTA | QUINTA | SEXTA | SABADO | TODOS_OS_DIAS | DOMINGO",
  "option_label": "string | null (ex: '1ª Opção')",
  "name": "string",
  "ingredients": "string | null",
  "has_salad": "boolean",
  "price": "number (ex: 22.0)",
  "image_url": "string | null (url pública da foto)",
  "is_available": "boolean",
  "display_order": "number"
}
```

#### DTO do Adicional (`MenuAddonDto`)
```json
{
  "id": "uuid (string)",
  "name": "string (ex: 'Ovo Frito Extra')",
  "price": "number (ex: 3.0)",
  "is_available": "boolean",
  "display_order": "number"
}
```

#### Resposta `GET /menu/today`
```json
{
  "day_of_week": "SEGUNDA | TERCA | ...",
  "day_name": "Segunda-feira | Terça-feira | ...",
  "is_open": "boolean",
  "message": "string | undefined (preenchido se fechado ou domingo)",
  "dishes": ["array de MenuItemDto"],
  "beverages": ["array de MenuItemDto"],
  "addons": ["array de MenuAddonDto"]
}
```

---

### 3.2 Configurações (`GET /settings`)
```json
{
  "id": "number",
  "name": "string (ex: 'Marmitaria do Dia')",
  "is_open": "boolean",
  "opening_time": "string (ex: '11:00')",
  "closing_time": "string (ex: '14:30')",
  "phone_whatsapp": "string (ex: '11999999999')",
  "pix_key": "string (ex: 'contato@marmitariadodia.com.br')",
  "address_text": "string",
  "takeout_open_time": "string | null",
  "currently_open": "boolean (VALOR CONSOLIDADO: se aberto agora no fuso SP)"
}
```

---

### 3.3 Zonas de Entrega (`GET /delivery-zones`)
Retorna array de zonas:
```json
[
  {
    "id": "uuid",
    "neighborhood": "string (ex: 'Centro')",
    "delivery_fee": "number (ex: 5.0)",
    "estimated_time_min": "number | null (ex: 40)",
    "is_active": "boolean"
  }
]
```

---

### 3.4 Criação de Pedido (`POST /orders`)

#### Payload de Envio (Request Body):
```json
{
  "customer": {
    "id": "uuid (opcional, se cliente já logado)",
    "full_name": "string (min: 2)",
    "phone": "string (min: 8)"
  },
  "delivery_type": "DELIVERY | TAKEOUT",
  "address_id": "uuid (opcional, se endereço já cadastrado)",
  "address": {
    "street": "string",
    "number": "string",
    "complement": "string | null (opcional)",
    "neighborhood": "string (OBRIGATÓRIO: deve existir em delivery_zones)",
    "city": "string (default: 'São Paulo')",
    "state": "string (default: 'SP')",
    "zip_code": "string | null (opcional)",
    "reference_point": "string | null (opcional)"
  },
  "takeout_time": "string (opcional, ex: '12:15')",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": "number (int > 0, default: 1)",
      "has_salad": "boolean (default: true)",
      "preferences": "string | null (opcional, máx 255)",
      "addon_ids": ["array de uuids de adicionais"]
    }
  ],
  "payment_method": "PIX | CREDIT_CARD | CASH_ON_DELIVERY | CARD_ON_DELIVERY",
  "need_change": "boolean (default: false)",
  "change_for": "number | null (obrigatório se CASH_ON_DELIVERY e need_change: true)",
  "notes": "string | null (máx 500)"
}
```

#### Resposta de Sucesso (`200 OK` / `201 Created`):
```json
{
  "id": "uuid (ID do pedido)",
  "order_number": 1042,
  "order_number_formatted": "#1042",
  "status": "PENDING",
  "delivery_type": "DELIVERY | TAKEOUT",
  "payment_method": "PIX | CREDIT_CARD | CASH_ON_DELIVERY | CARD_ON_DELIVERY",
  "subtotal": 27.0,
  "delivery_fee": 5.0,
  "discount": 0.0,
  "total_amount": 32.0,
  "customer": {
    "id": "uuid",
    "name": "Maria Silva",
    "phone": "11988887777"
  },
  "payment": {
    "id": "uuid",
    "status": "PENDING",
    "provider": "PIX_BACEN",
    "qr_code_pix": "000201... (payload EMV Copia e Cola completo com CRC16)",
    "pix_key": "contato@marmitariadodia.com.br",
    "tx_id": "PEDIDO1042"
  }
}
```

---

### 3.5 Detalhes do Pedido (`GET /orders/:id`)
Retorna a árvore completa do pedido com `customer`, `address`, `items` (com adicionais inclusos), `payment` e `status_history`.

---

### 3.6 Atualização de Status (`PATCH /orders/:id/status`)
```json
// Request Body
{
  "status": "CONFIRMED | IN_PREPARATION | OUT_FOR_DELIVERY | DELIVERED | CANCELED",
  "notes": "string opcional"
}
```

---

## 4. Estrutura de Modelos Kotlin (Para Android Studio / Retrofit)

Cole este código diretamente no projeto Android para consumo da API:

```kotlin
package br.com.marmitex.data.model

import com.google.gson.annotations.SerializedName

// --- CARDÁPIO ---
data class TodayMenuResponse(
    @SerializedName("day_of_week") val dayOfWeek: String,
    @SerializedName("day_name") val dayName: String,
    @SerializedName("is_open") val isOpen: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("dishes") val dishes: List<MenuItemDto>,
    @SerializedName("beverages") val beverages: List<MenuItemDto>,
    @SerializedName("addons") val addons: List<MenuAddonDto>
)

data class MenuItemDto(
    val id: String,
    val category: String,
    @SerializedName("day_of_week") val dayOfWeek: String,
    @SerializedName("option_label") val optionLabel: String?,
    val name: String,
    val ingredients: String?,
    @SerializedName("has_salad") val hasSalad: Boolean,
    val price: Double,
    @SerializedName("image_url") val imageUrl: String?,
    @SerializedName("is_available") val isAvailable: Boolean,
    @SerializedName("display_order") val displayOrder: Int
)

data class MenuAddonDto(
    val id: String,
    val name: String,
    val price: Double,
    @SerializedName("is_available") val isAvailable: Boolean,
    @SerializedName("display_order") val displayOrder: Int
)

// --- CONFIGURAÇÕES ---
data class RestaurantSettings(
    val id: Int,
    val name: String,
    @SerializedName("is_open") val isOpen: Boolean,
    @SerializedName("opening_time") val openingTime: String,
    @SerializedName("closing_time") val closingTime: String,
    @SerializedName("phone_whatsapp") val phoneWhatsapp: String,
    @SerializedName("pix_key") val pixKey: String,
    @SerializedName("address_text") val addressText: String,
    @SerializedName("takeout_open_time") val takeoutOpenTime: String?,
    @SerializedName("currently_open") val currentlyOpen: Boolean
)

// --- CRIAÇÃO DE PEDIDO ---
data class CreateOrderRequest(
    val customer: CustomerRequest,
    @SerializedName("delivery_type") val deliveryType: String, // "DELIVERY" ou "TAKEOUT"
    @SerializedName("address_id") val addressId: String? = null,
    val address: AddressRequest? = null,
    @SerializedName("takeout_time") val takeoutTime: String? = null,
    val items: List<OrderItemRequest>,
    @SerializedName("payment_method") val paymentMethod: String, // "PIX", "CREDIT_CARD", etc.
    @SerializedName("need_change") val needChange: Boolean = false,
    @SerializedName("change_for") val changeFor: Double? = null,
    val notes: String? = null
)

data class CustomerRequest(
    val id: String? = null,
    @SerializedName("full_name") val fullName: String,
    val phone: String
)

data class AddressRequest(
    val street: String,
    val number: String,
    val complement: String? = null,
    val neighborhood: String,
    val city: String = "São Paulo",
    val state: String = "SP",
    @SerializedName("zip_code") val zipCode: String? = null,
    @SerializedName("reference_point") val referencePoint: String? = null
)

data class OrderItemRequest(
    @SerializedName("menu_item_id") val menuItemId: String,
    val quantity: Int = 1,
    @SerializedName("has_salad") val hasSalad: Boolean = true,
    val preferences: String? = null,
    @SerializedName("addon_ids") val addonIds: List<String> = emptyList()
)

data class CreateOrderResponse(
    val id: String,
    @SerializedName("order_number") val orderNumber: Long,
    @SerializedName("order_number_formatted") val orderNumberFormatted: String,
    val status: String,
    @SerializedName("delivery_type") val deliveryType: String,
    @SerializedName("payment_method") val paymentMethod: String,
    val subtotal: Double,
    @SerializedName("delivery_fee") val deliveryFee: Double,
    val discount: Double,
    @SerializedName("total_amount") val totalAmount: Double,
    val payment: PixPaymentInfo?
)

data class PixPaymentInfo(
    val id: String,
    val status: String,
    val provider: String,
    @SerializedName("qr_code_pix") val qrCodePix: String,
    @SerializedName("pix_key") val pixKey: String,
    @SerializedName("tx_id") val txId: String
)
```

---

## 5. Interface Retrofit para Android Studio

```kotlin
package br.com.marmitex.data.api

import br.com.marmitex.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface MarmitexApiService {
    @GET("menu/today")
    suspend fun getTodayMenu(): Response<TodayMenuResponse>

    @GET("settings")
    suspend fun getSettings(): Response<RestaurantSettings>

    @GET("delivery-zones")
    suspend fun getDeliveryZones(): Response<List<DeliveryZoneItem>>

    @POST("orders")
    suspend fun createOrder(@Body order: CreateOrderRequest): Response<CreateOrderResponse>

    @GET("orders/{id}")
    suspend fun getOrderById(@Path("id") id: String): Response<OrderCompleteDetails>
}
```
