import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PaymentsController } from './payments.controller';
import { paymentWebhookSchema } from './payments.schema';

export async function paymentsRoutes(app: FastifyInstance) {
  const controller = new PaymentsController();

  app.withTypeProvider<ZodTypeProvider>().post(
    '/payments/webhook',
    {
      schema: {
        tags: ['Pagamentos & Webhook'],
        summary: 'Webhook de confirmação de pagamento',
        description:
          'Recebe notificação de pagamento do gateway (Mercado Pago, Asaas, etc.), atualiza o status do pagamento para PAID e o status do pedido para CONFIRMED.',
        body: paymentWebhookSchema,
      },
    },
    controller.handleWebhook
  );
}
