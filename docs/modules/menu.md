# Módulo: Cardápio (`menu`)

O módulo **`menu`** é responsável pela consulta, filtragem, agrupamento e disponibilização dos pratos do dia, bebidas e adicionais do restaurante.

---

## 1. Estrutura de Arquivos

```
src/modules/menu/
├── menu.controller.ts   # Handler das requisições HTTP Fastify
├── menu.repository.ts   # Acesso às tabelas 'menu_items' e 'menu_addons'
├── menu.routes.ts       # Declaração das rotas e documentação Swagger
├── menu.schema.ts       # Schemas de validação e DTOs via Zod
└── menu.service.ts      # Regras de negócio (dia da semana, domingo fechado, etc.)
```

---

## 2. Classes e Métodos

### 2.1 `MenuController` (`src/modules/menu/menu.controller.ts`)
Controlador HTTP fino (*thin controller*).

- `async getTodayMenu(request: FastifyRequest, reply: FastifyReply): Promise<TodayMenuResponse>`
  - Invoca `menuService.getTodayMenu()` e retorna os pratos, bebidas e adicionais disponíveis hoje.
- `async getWeeklyMenu(request: FastifyRequest, reply: FastifyReply): Promise<WeeklyMenuResponse>`
  - Invoca `menuService.getWeeklyMenu()` e retorna o cardápio agrupado de Segunda a Sábado.

### 2.2 `MenuService` (`src/modules/menu/menu.service.ts`)
Orquestrador de lógica de domínio.

- **Dependências Injetadas:**
  - `private readonly menuRepository: MenuRepository`
  - `private readonly settingsRepository: SettingsRepository`

- **Métodos Privados:**
  - `private mapMenuItem(item: MenuItem): MenuItemDto`: Normaliza tipos numéricos (`Number(item.price)`), converte booleano (`Boolean(item.has_salad)`) e formata campos nulos.
  - `private mapAddon(addon: MenuAddon): MenuAddonDto`: Normaliza campos de adicionais.

- **Métodos Públicos:**
  - `async getTodayMenu(): Promise<TodayMenuResponse>`:
    1. Obtém o dia da semana atual no fuso horário de São Paulo (`getCurrentDayOfWeek()`).
    2. Se o dia for `'DOMINGO'`, retorna imediatamente `{ is_open: false, message: 'A marmitaria não funciona aos domingos...', dishes: [], beverages: [], addons: [] }`.
    3. Caso contrário, consulta em paralelo as configurações operacionais (`settingsRepository.getSettings()`), os itens cadastrados para o dia (`menuRepository.getItemsForDay(currentDay)`) e os adicionais ativos (`menuRepository.getActiveAddons()`).
    4. Avalia se o horário atual está dentro da janela de funcionamento (`isWithinBusinessHours()`).
    5. Separa itens entre pratos principais (`PRATO_DO_DIA`) e bebidas (`BEBIDA`).
    6. Retorna o DTO completo com indicador `is_open`.

  - `async getWeeklyMenu(): Promise<WeeklyMenuResponse>`:
    1. Busca todos os itens ativos e adicionais em paralelo.
    2. Itera sobre os dias úteis (`SEGUNDA` até `SABADO`).
    3. Para cada dia, filtra os pratos cujo `day_of_week` coincida com o dia ou que sejam marcados como `TODOS_OS_DIAS`.
    4. Retorna a lista organizada em `weekly_schedule`, `beverages` e `addons`.

### 2.3 `MenuRepository` (`src/modules/menu/menu.repository.ts`)
Camada de persistência via Supabase Client.

- `async getItemsForDay(day: DayOfWeek): Promise<MenuItem[]>`:
  - Consulta `menu_items` onde `is_available = true` e `day_of_week IN (day, 'TODOS_OS_DIAS')` ordenado por `display_order ASC`.
- `async getAllActiveItems(): Promise<MenuItem[]>`:
  - Consulta todos os pratos onde `is_available = true` ordenados por `display_order ASC`.
- `async getActiveAddons(): Promise<MenuAddon[]>`:
  - Consulta `menu_addons` onde `is_available = true` ordenados por `display_order ASC`.
- `async findItemsByIds(ids: string[]): Promise<MenuItem[]>`:
  - Utilizado no checkout para carregar os pratos do pedido pelo array de UUIDs.
- `async findAddonsByIds(ids: string[]): Promise<MenuAddon[]>`:
  - Utilizado no checkout para carregar os adicionais pelo array de UUIDs.

---

## 3. Schemas e Tipos (`src/modules/menu/menu.schema.ts`)

```typescript
export interface MenuItemDto {
  id: string;
  category: 'PRATO_DO_DIA' | 'BEBIDA';
  day_of_week: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO' | 'TODOS_OS_DIAS' | 'DOMINGO';
  option_label: string | null; // ex: '1ª Opção', '2ª Opção'
  name: string;
  ingredients: string | null;
  has_salad: boolean;
  price: number;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
}

export interface MenuAddonDto {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  display_order: number;
}
```

---

## 4. Regras de Negócio e Casos Especiais

1. **Sensibilidade a Fuso Horário:** A virada do cardápio diário ocorre exatamente às 00:00 no fuso de São Paulo (`America/Sao_Paulo`). Se o servidor estiver rodando na UTC da Vercel (ex: 22h no Brasil = 01h UTC do dia seguinte), o método `getCurrentDayOfWeek()` compensa adequadamente o horário local brasileiro.
2. **Item Marcado como "TODOS_OS_DIAS":** Se um prato for cadastrado com `day_of_week = 'TODOS_OS_DIAS'`, ele é retornado em todos os dias da semana (útil para pratos executivos permanentes ou bebidas).
3. **Domingos:** Nenhuma consulta de prato é feita no domingo; o sistema retorna imediatamente resposta vazia com status fechado.
