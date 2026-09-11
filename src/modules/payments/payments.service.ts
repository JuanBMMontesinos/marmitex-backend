import { PaymentsRepository } from './payments.repository';
import { OrdersRepository } from '../orders/orders.repository';
import type { PaymentWebhookInput } from './payments.schema';
import { NotFoundError } from '../../shared/errors/app-error';

export class PaymentsService {
  constructor(
    private readonly paymentsRepository = new PaymentsRepository(),
    private readonly ordersRepository = new OrdersRepository()
  ) {}

  async processWebhook(payload: PaymentWebhookInput, rawBody?: unknown) {
    const externalId = payload.external_id || payload.tx_id;
    const orderId = payload.order_id;

    let payment = null;

    if (externalId) {
      payment = await this.paymentsRepository.findByExternalId(externalId);
    }

    if (!payment && orderId) {
      payment = await this.paymentsRepository.findByOrderId(orderId);
    }

    // Se nenhum pagamento foi encontrado pelas chaves diretas
    if (!payment) {
      // Suporte a payloads com estrutura aninhada (ex: Mercado Pago { data: { id: "..." } })
      const anyBody = rawBody as Record<string, unknown> | undefined;
      const nestedId = (anyBody?.data as Record<string, unknown> | undefined)?.id;
      if (typeof nestedId === 'string' || typeof nestedId === 'number') {
        payment = await this.paymentsRepository.findByExternalId(String(nestedId));
      }
    }

    if (!payment) {
      throw new NotFoundError(
        'Pagamento correspondente não foi encontrado para os dados informados no webhook.'
      );
    }

    // Marca pagamento como pago
    const updatedPayment = await this.paymentsRepository.markAsPaid(payment.id);

    // Atualiza status do pedido para 'CONFIRMED' caso esteja 'PENDING'
    const order = await this.ordersRepository.findOrderById(payment.order_id);
    if (!order) {
      throw new NotFoundError(`Pedido com ID "${payment.order_id}" não encontrado.`);
    }

    if (order.status === 'PENDING') {
      await this.ordersRepository.updateOrderStatus(order.id, 'CONFIRMED');

      await this.ordersRepository.createOrderStatusHistory({
        order_id: order.id,
        from_status: 'PENDING',
        to_status: 'CONFIRMED',
        notes: 'Pagamento confirmado automaticamente via Webhook do Gateway',
      });
    }

    return {
      success: true,
      message: 'Pagamento confirmado e pedido atualizado para CONFIRMED com sucesso.',
      order_id: order.id,
      order_number: order.order_number,
      payment_status: updatedPayment.status,
    };
  }
}
