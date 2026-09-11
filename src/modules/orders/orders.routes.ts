import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { OrdersController } from './orders.controller';
import {
  createOrderInputSchema,
  orderDetailParamsSchema,
  updateOrderStatusInputSchema,
} from './orders.schema';

export async function ordersRoutes(app: FastifyInstance) {
  const controller = new OrdersController();

  app.withTypeProvider<ZodTypeProvider>().post(
    '/orders',
    {
      schema: {
        tags: ['Pedidos & Checkout'],
        summary: 'Criar novo pedido de marmitex',
        description:
          'Recebe o pedido com dados do cliente, itens com preferências e adicionais, endereço ou retirada, forma de pagamento e calcula o total estritamente no servidor.',
        body: createOrderInputSchema,
      },
    },
    controller.createOrder
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    '/orders/:id',
    {
      schema: {
        tags: ['Pedidos & Checkout'],
        summary: 'Obter detalhes completos do pedido',
        description:
          'Retorna o pedido com seus itens, adicionais, endereço de entrega, pagamento e histórico de status.',
        params: orderDetailParamsSchema,
      },
    },
    controller.getOrderById
  );

  app.withTypeProvider<ZodTypeProvider>().patch(
    '/orders/:id/status',
    {
      schema: {
        tags: ['Pedidos & Backoffice'],
        summary: 'Atualizar status do pedido (Painel da Cozinha)',
        description:
          'Endpoint administrativo/backoffice para atualizar o status do pedido (ex: CONFIRMED, IN_PREPARATION, OUT_FOR_DELIVERY, DELIVERED, CANCELED).',
        params: orderDetailParamsSchema,
        body: updateOrderStatusInputSchema,
      },
    },
    controller.updateOrderStatus
  );
}
