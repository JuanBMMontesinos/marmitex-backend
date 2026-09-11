import { z } from 'zod';

export const restaurantSettingsResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_open: z.boolean(),
  opening_time: z.string(),
  closing_time: z.string(),
  phone_whatsapp: z.string(),
  pix_key: z.string(),
  address_text: z.string(),
  takeout_open_time: z.string().nullable(),
  currently_open: z.boolean().describe('Indica se o restaurante está aberto considerando o horário atual de São Paulo e o status configurado'),
});

export type RestaurantSettingsResponse = z.infer<typeof restaurantSettingsResponseSchema>;
