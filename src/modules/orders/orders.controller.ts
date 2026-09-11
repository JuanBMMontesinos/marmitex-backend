import type { FastifyReply, FastifyRequest } from 'fastify';
import { OrdersService } from './orders.service';
import type {
  CreateOrderInput,
  OrderDetailParams,
  UpdateOrderStatusInput,
} from './orders.schema';

export class OrdersController {
  constructor(private readonly ordersService = new OrdersService()) {}

  createOrder = async (
    request: FastifyRequest<{ Body: CreateOrderInput }>,
    reply: FastifyReply
  ) => {
    const result = await this.ordersService.createOrder(request.body);
    return reply.status(201).send(result);
  };

  getOrderById = async (
    request: FastifyRequest<{ Params: OrderDetailParams }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    const result = await this.ordersService.getOrderById(id);
    return reply.status(200).send(result);
  };

  updateOrderStatus = async (
    request: FastifyRequest<{
      Params: OrderDetailParams;
      Body: UpdateOrderStatusInput;
    }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    const { status, notes } = request.body;
    const result = await this.ordersService.updateOrderStatus(id, status, notes);
    return reply.status(200).send(result);
  };
}
