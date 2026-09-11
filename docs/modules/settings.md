# Módulo: Configurações (`settings`)

O módulo **`settings`** gerencia os parâmetros operacionais globais da marmitaria, tais como horários de abertura e fechamento, estado manual de funcionamento, chave PIX, telefone de WhatsApp e endereço da loja física.

---

## 1. Estrutura de Arquivos

```
src/modules/settings/
├── settings.controller.ts   # Handler HTTP da rota /settings
├── settings.repository.ts   # Consulta à tabela 'restaurant_settings'
├── settings.routes.ts       # Registro da rota Fastify
├── settings.schema.ts       # Schemas Zod e tipos de retorno
└── settings.service.ts      # Cálculo dinâmico do status de funcionamento
```

---

## 2. Classes e Métodos

### 2.1 `SettingsController` (`src/modules/settings/settings.controller.ts`)
- `async getSettings(request: FastifyRequest, reply: FastifyReply): Promise<RestaurantSettingsResponse>`
  - Retorna as configurações da marmitaria e o indicador calculado `currently_open`.

### 2.2 `SettingsService` (`src/modules/settings/settings.service.ts`)
- **Dependência Injetada:** `private readonly settingsRepository: SettingsRepository`
- **Métodos Públicos:**
  - `async getSettings(): Promise<RestaurantSettingsResponse>`:
    1. Executa consulta no repositório.
    2. **Contingência (Fallback):** Se a tabela `restaurant_settings` estiver vazia, retorna um objeto padrão pré-configurado:
       ```typescript
       {
         id: 1,
         name: 'Marmitaria do Dia',
         is_open: true,
         opening_time: '11:00',
         closing_time: '14:30',
         phone_whatsapp: '11999999999',
         pix_key: 'contato@marmitariadodia.com.br',
         address_text: 'Rua Principal, 123 - Centro',
         takeout_open_time: '11:00',
         currently_open: true
       }
       ```
    3. Obtém o dia atual no fuso de São Paulo (`getCurrentDayOfWeek()`).
    4. Avalia se o horário atual de São Paulo está entre `opening_time` e `closing_time` através de `isWithinBusinessHours()`.
    5. Computa `currently_open`:
       ```typescript
       const isSunday = currentDay === 'DOMINGO';
       const isScheduleActive = isWithinBusinessHours(settings.opening_time, settings.closing_time);
       const currentlyOpen = settings.is_open && !isSunday && isScheduleActive;
       ```
    6. Retorna o DTO com o campo `currently_open`.

### 2.3 `SettingsRepository` (`src/modules/settings/settings.repository.ts`)
- `async getSettings(): Promise<RestaurantSettings | null>`:
  - Consulta `restaurant_settings` limitando a 1 registro via `maybeSingle()`.

---

## 3. Schema de Resposta (`src/modules/settings/settings.schema.ts`)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `number` | Identificador único do registro (geralmente 1). |
| `name` | `string` | Nome de exibição do restaurante. |
| `is_open` | `boolean` | Flag manual ativada/desativada pela cozinha. |
| `opening_time` | `string` | Horário de abertura programado (formato "HH:mm"). |
| `closing_time` | `string` | Horário de encerramento dos pedidos (formato "HH:mm"). |
| `phone_whatsapp` | `string` | Telefone de contato para link direto com WhatsApp. |
| `pix_key` | `string` | Chave PIX padrão para geração de QR Code e cobrança. |
| `address_text` | `string` | Endereço físico para retirada no local. |
| `takeout_open_time`| `string \| null` | Horário de início permitido para retiradas. |
| `currently_open` | `boolean` | **Status real consolidado:** considera dia útil, horário de SP e chave `is_open`. |

---

## 4. Integração com Clientes (Android & Web)

Os aplicativos cliente devem usar o campo booleano **`currently_open`** para:
- Desabilitar ou alertar no botão "Finalizar Pedido" quando `currently_open === false`.
- Exibir banner na tela inicial informando o horário de abertura (ex: "Abrimos às 11:00").
- Exibir botão de suporte flutuante direcionando para a URL: `https://wa.me/55{phone_whatsapp}`.
