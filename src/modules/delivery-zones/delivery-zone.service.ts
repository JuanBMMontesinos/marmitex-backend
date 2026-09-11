import { DeliveryZoneRepository } from './delivery-zone.repository';
import type { DeliveryZonesResponse } from './delivery-zone.schema';

export class DeliveryZoneService {
  constructor(private readonly deliveryZoneRepository = new DeliveryZoneRepository()) {}

  async listActiveZones(): Promise<DeliveryZonesResponse> {
    const zones = await this.deliveryZoneRepository.listActive();

    return zones.map((zone) => ({
      id: zone.id,
      neighborhood: zone.neighborhood,
      delivery_fee: Number(zone.delivery_fee),
      estimated_time_min: zone.estimated_time_min,
      is_active: zone.is_active,
    }));
  }
}
