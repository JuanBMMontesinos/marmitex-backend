import { z } from 'zod';

export const deliveryZoneItemSchema = z.object({
  id: z.string().uuid(),
  neighborhood: z.string(),
  delivery_fee: z.number().nonnegative(),
  estimated_time_min: z.number().nullable(),
  is_active: z.boolean(),
});

export const deliveryZonesResponseSchema = z.array(deliveryZoneItemSchema);

export type DeliveryZoneItem = z.infer<typeof deliveryZoneItemSchema>;
export type DeliveryZonesResponse = z.infer<typeof deliveryZonesResponseSchema>;
