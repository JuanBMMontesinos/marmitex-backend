import { z } from 'zod';

export const menuItemDtoSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(['PRATO_DO_DIA', 'BEBIDA']),
  day_of_week: z.enum([
    'SEGUNDA',
    'TERCA',
    'QUARTA',
    'QUINTA',
    'SEXTA',
    'SABADO',
    'TODOS_OS_DIAS',
    'DOMINGO',
  ]),
  option_label: z.string().nullable(),
  name: z.string(),
  ingredients: z.string().nullable(),
  has_salad: z.boolean(),
  price: z.number().nonnegative(),
  image_url: z.string().nullable(),
  is_available: z.boolean(),
  display_order: z.number(),
});

export const menuAddonDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number().nonnegative(),
  is_available: z.boolean(),
  display_order: z.number(),
});

export const todayMenuResponseSchema = z.object({
  day_of_week: z.string(),
  day_name: z.string(),
  is_open: z.boolean(),
  message: z.string().optional(),
  dishes: z.array(menuItemDtoSchema),
  beverages: z.array(menuItemDtoSchema),
  addons: z.array(menuAddonDtoSchema),
});

export const weeklyDayMenuSchema = z.object({
  day_of_week: z.enum(['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']),
  day_name: z.string(),
  dishes: z.array(menuItemDtoSchema),
});

export const weeklyMenuResponseSchema = z.object({
  weekly_schedule: z.array(weeklyDayMenuSchema),
  beverages: z.array(menuItemDtoSchema),
  addons: z.array(menuAddonDtoSchema),
});

export type MenuItemDto = z.infer<typeof menuItemDtoSchema>;
export type MenuAddonDto = z.infer<typeof menuAddonDtoSchema>;
export type TodayMenuResponse = z.infer<typeof todayMenuResponseSchema>;
export type WeeklyMenuResponse = z.infer<typeof weeklyMenuResponseSchema>;
