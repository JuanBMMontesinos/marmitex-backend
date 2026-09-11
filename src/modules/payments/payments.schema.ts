import { z } from 'zod';

export const paymentWebhookSchema = z.object({
  event: z.string().optional(),
  order_id: z.string().uuid().optional(),
  external_id: z.string().optional(),
  tx_id: z.string().optional(),
  status: z.string().optional(),
  provider: z.string().optional(),
});

export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;
