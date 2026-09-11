import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SettingsController } from './settings.controller';
import { restaurantSettingsResponseSchema } from './settings.schema';

export async function settingsRoutes(app: FastifyInstance) {
  const controller = new SettingsController();

  app.withTypeProvider<ZodTypeProvider>().get(
    '/settings',
    {
      schema: {
        tags: ['Configurações'],
        summary: 'Obter dados do restaurante e status de funcionamento',
        description: 'Retorna os dados do restaurante (horário, whatsapp, pix_key, endereço) e se está aberto agora.',
        response: {
          200: restaurantSettingsResponseSchema,
        },
      },
    },
    controller.getSettings
  );
}
