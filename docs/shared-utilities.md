# Utilitários Compartilhados (`shared`)

Este documento especifica os componentes transversais de utilidade, cálculos de fuso horário, gerador de pagamentos PIX e hierarquia de exceções personalizadas localizados na pasta `src/shared/`.

---

## 1. Estrutura de Arquivos

```
src/shared/
├── errors/
│   ├── app-error.ts       # Hierarquia de classes de exceções HTTP
│   └── error-handler.ts   # Interceptador global de erros do Fastify
└── utils/
    ├── date.ts            # Manipulação temporal estrita no fuso de São Paulo
    └── pix.ts             # Algoritmo de geração EMV TLV e CRC16 para PIX
```

---

## 2. Utilitários de Data & Fuso Horário (`src/shared/utils/date.ts`)

Como a aplicação é executada em servidores distribuídos (onde o relógio do sistema pode estar em UTC, como na nuvem da Vercel ou na AWS), o cálculo de horários de funcionamento e a seleção do prato do dia são obrigatoriamente ancorados no fuso horário oficial de Brasília (`America/Sao_Paulo`).

### Constantes Exportadas:
- `SAO_PAULO_TZ = 'America/Sao_Paulo'`
- `DAY_NAMES_PT`: Mapeamento de `DayOfWeek` para o nome em português por extenso:
  ```typescript
  {
    DOMINGO: 'Domingo',
    SEGUNDA: 'Segunda-feira',
    TERCA: 'Terça-feira',
    QUARTA: 'Quarta-feira',
    QUINTA: 'Quinta-feira',
    SEXTA: 'Sexta-feira',
    SABADO: 'Sábado',
    TODOS_OS_DIAS: 'Todos os Dias'
  }
  ```

### Funções Exportadas:

#### `getNowInSaoPaulo(): Date`
Retorna uma instância de `Date` ajustada com base na hora civil de São Paulo.

#### `getCurrentDayOfWeek(date = new Date()): DayOfWeek`
Calcula o índice do dia (0 a 6) no fuso de São Paulo e retorna o enum correspondente (`DOMINGO`, `SEGUNDA`, ..., `SABADO`).

#### `isWithinBusinessHours(openingTimeStr?: string | null, closingTimeStr?: string | null, currentDate = new Date()): boolean`
- Converte os horários de abertura e fechamento (formato `"HH:mm"`) e o horário atual para minutos acumulados desde o início do dia (`horas * 60 + minutos`).
- Retorna `true` se `currentMinutes >= openTotal && currentMinutes <= closeTotal`.
- Se os horários não forem fornecidos, adota comportamento permissivo (`true`).

#### `formatToSaoPauloIso(date = new Date()): string`
Formata uma data para o padrão de exibição brasileiro (`pt-BR`) considerando o fuso de São Paulo.

---

## 3. Utilitário de Geração PIX (`src/shared/utils/pix.ts`)

Implementa a especificação oficial do **Banco Central do Brasil** para o padrão EMV (QR Code Estático / Dinâmico e Copia e Cola).

### Funções Internas e Exportadas:

#### `calculateCRC16(str: string): string`
Implementa o algoritmo **CRC-16/CCITT-FALSE** com polinômio gerador `0x1021` e registrador inicial inicializado em `0xFFFF`.
- Percorre cada caractere da cadeia de texto.
- Realiza rotações bit a bit e operação XOR com o polinômio.
- Retorna a representação hexadecimal em maiúsculas com preenchimento à esquerda de 4 caracteres (ex: `"89A1"`).

#### `formatTLV(id: string, value: string): string`
Formata uma estrutura **Tag-Length-Value (TLV)**:
- `id`: Código de 2 dígitos do campo (ex: `"00"`, `"54"`).
- `value`: Conteúdo em texto.
- Retorna: `id + tamanho_com_2_digitos + value`.

#### `generatePixCopiaECola(options: PixPayloadOptions): string`
Parâmetros de entrada:
```typescript
interface PixPayloadOptions {
  pixKey: string;          // Chave PIX destino
  merchantName: string;    // Nome do recebedor (sanitizado sem acentos, máx 25)
  merchantCity?: string;   // Cidade do recebedor (padrão 'SAO PAULO', máx 15)
  amount: number;          // Valor numérico em reais
  txId: string;            // Identificador da transação (máx 25 caracteres)
  description?: string;    // Descrição informativa opcional
}
```

---

## 4. Hierarquia de Erros da Aplicação (`src/shared/errors/app-error.ts`)

Todas as exceções previsíveis de negócio herdam da classe base `AppError`.

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

### Classes Especializadas:
| Classe | Status HTTP | Uso |
|---|---|---|
| `BadRequestError` | `400` | Requisição inválida ou violação de regra de negócio (ex: item esgotado). |
| `UnauthorizedError` | `401` | Falha de autenticação ou token inválido. |
| `NotFoundError` | `404` | Registro não localizado (pedido, item, endereço). |
| `ConflictError` | `409` | Conflito de estado ou duplicidade de registro. |
| `ValidationError` | `422` | Falha semântica nos dados fornecidos. |

---

## 5. Tratamento Global de Erros (`src/shared/errors/error-handler.ts`)

Registrado no Fastify via `app.setErrorHandler(errorHandler)`.

### Responsabilidades:
1. **Log estruturado:** Registra o erro completo no logger do Fastify (`request.log.error(error)`).
2. **Tratamento de `AppError`:** Retorna o status HTTP específico e a mensagem semântica configurada pelo desenvolvedor.
3. **Tratamento de `ZodError`:** Formata os erros de validação de schema utilizando `error.flatten().fieldErrors`, permitindo que os clientes (como o app Android) saibam exatamente quais campos falharam.
4. **Tratamento de Erros do Supabase/PostgREST:**
   - Código `PGRST116`: Mapeado para `404 Not Found`.
   - Código `23505`: Mapeado para `409 Conflict` (violação de chave única).
5. **Fallback Seguro para Erros 500:**
   - Em ambiente de produção (`NODE_ENV === 'production'`), omite o stack trace e mensagens sensíveis de banco de dados, retornando `"Ocorreu um erro interno no servidor."` para prevenir vazamento de dados de infraestrutura.
