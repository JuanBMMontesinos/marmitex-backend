import { z } from 'zod';

export const orderCustomerSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().min(8, 'Telefone inválido'),
});

export const orderAddressSchema = z.object({
  street: z.string().min(2, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().nullable().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().default('São Paulo'),
  state: z.string().default('SP'),
  zip_code: z.string().nullable().optional(),
  reference_point: z.string().nullable().optional(),
});

export const orderItemInputSchema = z.object({
  menu_item_id: z.string().uuid('ID do prato ou bebida inválido'),
  quantity: z.number().int().positive('Quantidade deve ser maior que zero').default(1),
  has_salad: z.boolean().default(true),
  preferences: z.string().max(255).nullable().optional(),
  addon_ids: z.array(z.string().uuid()).optional().default([]),
});

export const createOrderInputSchema = z
  .object({
    customer: orderCustomerSchema,
    delivery_type: z.enum(['DELIVERY', 'TAKEOUT']),
    address_id: z.string().uuid().optional(),
    address: orderAddressSchema.optional(),
    takeout_time: z.string().optional(),
    items: z.array(orderItemInputSchema).min(1, 'O pedido deve conter ao menos 1 item'),
    payment_method: z.enum(['PIX', 'CREDIT_CARD', 'CASH_ON_DELIVERY', 'CARD_ON_DELIVERY']),
    need_change: z.boolean().default(false),
    change_for: z.number().positive().nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.delivery_type === 'DELIVERY') {
      if (!data.address_id && !data.address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Para entrega (DELIVERY), informe um address_id ou preencha o objeto address',
          path: ['address'],
        });
      }
    }

    if (data.payment_method === 'CASH_ON_DELIVERY' && data.need_change) {
      if (!data.change_for) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o valor para troco em change_for quando need_change for verdadeiro',
          path: ['change_for'],
        });
      }
    }
  });

export const updateOrderStatusInputSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'IN_PREPARATION',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELED',
  ]),
  notes: z.string().max(255).optional(),
});

export const orderDetailParamsSchema = z.object({
  id: z.string().uuid('ID do pedido inválido'),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;
export type OrderDetailParams = z.infer<typeof orderDetailParamsSchema>;
