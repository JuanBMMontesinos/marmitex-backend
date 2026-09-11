# Módulo: Zonas de Entrega (`delivery-zones`)

O módulo **`delivery-zones`** é responsável pela gestão dos bairros homologados para entrega a domicílio, determinação dos valores de frete e estimativas de tempo de trânsito.

---

## 1. Estrutura de Arquivos

```
src/modules/delivery-zones/
├── delivery-zone.controller.ts   # Handler HTTP da rota /delivery-zones
├── delivery-zone.repository.ts   # Consultas e buscas por bairro com case-insensitive
├── delivery-zone.routes.ts       # Declaração da rota Fastify
├── delivery-zone.schema.ts       # Schemas Zod de validação
└── delivery-zone.service.ts      # Conversão e regras das zonas ativas
```

---

## 2. Classes e Métodos

### 2.1 `DeliveryZoneController` (`src/modules/delivery-zones/delivery-zone.controller.ts`)
- `async listActiveZones(request: FastifyRequest, reply: FastifyReply): Promise<DeliveryZonesResponse>`
  - Retorna o array de bairros atendidos com status ativo.

### 2.2 `DeliveryZoneService` (`src/modules/delivery-zones/delivery-zone.service.ts`)
- **Dependência Injetada:** `private readonly deliveryZoneRepository: DeliveryZoneRepository`
- **Métodos Públicos:**
  - `async listActiveZones(): Promise<DeliveryZonesResponse>`:
    - Invoca `listActive()` no repositório e normaliza o valor monetário com `Number(zone.delivery_fee)`.

### 2.3 `DeliveryZoneRepository` (`src/modules/delivery-zones/delivery-zone.repository.ts`)
- `async listActive(): Promise<DeliveryZone[]>`:
  - Executa consulta na tabela `delivery_zones` filtrando por `is_active = true` e ordenando alfabeticamente por `neighborhood ASC`.
- `async findByNeighborhood(neighborhood: string): Promise<DeliveryZone | null>`:
  - Realiza busca não sensível a maiúsculas/minúsculas (*case-insensitive*) utilizando o operador `ilike` do PostgreSQL:
    ```typescript
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .ilike('neighborhood', neighborhood.trim())
      .eq('is_active', true)
      .maybeSingle();
    ```
  - Este método é crítico para a validação no momento do checkout em `OrdersService`.

---

## 3. Schemas de Dados (`src/modules/delivery-zones/delivery-zone.schema.ts`)

```typescript
export interface DeliveryZoneItem {
  id: string;                  // UUID da zona de entrega
  neighborhood: string;        // Nome oficial do bairro (ex: 'Vila Mariana')
  delivery_fee: number;        // Taxa de entrega em reais (ex: 7.50)
  estimated_time_min: number | null; // Tempo em minutos (ex: 40)
  is_active: boolean;          // Flag de atividade
}

export type DeliveryZonesResponse = DeliveryZoneItem[];
```

---

## 4. Regras de Negócio e Segurança de Frete

1. **Validação Estrita no Checkout:**
   - O aplicativo móvel pode consultar as zonas para exibir o valor estimado do frete na interface antes da finalização.
   - Contudo, no momento do envio do pedido (`POST /orders`), o backend não aceita o frete informado pelo cliente. O backend pesquisa o bairro informado (`address.neighborhood`) no banco de dados via `findByNeighborhood()`. Se o bairro não constar como ativo, a requisição é rejeitada com `400 Bad Request` informando que o bairro não é atendido e sugerindo a opção de Retirada (`TAKEOUT`).
2. **Retirada no Balcão (`TAKEOUT`):**
   - Quando o tipo de entrega for `TAKEOUT`, o valor da taxa de entrega é compulsoriamente forçado para `0.00`, independentemente de qualquer endereço prévio cadastrado.
