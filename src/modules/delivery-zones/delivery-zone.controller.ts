import type { FastifyReply, FastifyRequest } from 'fastify';
import { DeliveryZoneService } from './delivery-zone.service';

export class DeliveryZoneController {
  constructor(private readonly deliveryZoneService = new DeliveryZoneService()) {}

  listActiveZones = async (_request: FastifyRequest, reply: FastifyReply) => {
    const zones = await this.deliveryZoneService.listActiveZones();
    return reply.status(200).send(zones);
  };
}
