import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { DeliveryZoneController } from './delivery-zone.controller';
import { deliveryZonesResponseSchema } from './delivery-zone.schema';

export async function deliveryZoneRoutes(app: FastifyInstance) {
  const controller = new DeliveryZoneController();

  app.withTypeProvider<ZodTypeProvider>().get(
    '/delivery-zones',
    {
      schema: {
        tags: ['Taxas e Bairros'],
        summary: 'Listar bairros atendidos e taxas de frete',
        description: 'Retorna todos os bairros ativos atendidos pela marmitaria com taxa de entrega e tempo estimado.',
        response: {
          200: deliveryZonesResponseSchema,
        },
      },
    },
    controller.listActiveZones
  );
}
