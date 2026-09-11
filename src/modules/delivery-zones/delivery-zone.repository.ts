import { supabase } from '../../database/supabase';
import type { DeliveryZone } from '../../database/types';

export class DeliveryZoneRepository {
  async listActive(): Promise<DeliveryZone[]> {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('is_active', true)
      .order('neighborhood', { ascending: true });

    if (error) {
      throw error;
    }

    return (data as DeliveryZone[]) || [];
  }

  async findById(id: string): Promise<DeliveryZone | null> {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as unknown as DeliveryZone) || null;
  }

  async findByNeighborhood(neighborhood: string): Promise<DeliveryZone | null> {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .ilike('neighborhood', neighborhood.trim())
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as unknown as DeliveryZone) || null;
  }
}
