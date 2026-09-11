import type { FastifyReply, FastifyRequest } from 'fastify';
import { PaymentsService } from './payments.service';
import type { PaymentWebhookInput } from './payments.schema';

export class PaymentsController {
  constructor(private readonly paymentsService = new PaymentsService()) {}

  handleWebhook = async (
    request: FastifyRequest<{ Body: PaymentWebhookInput }>,
    reply: FastifyReply
  ) => {
    const result = await this.paymentsService.processWebhook(
      request.body,
      request.body
    );
    return reply.status(200).send(result);
  };
}
