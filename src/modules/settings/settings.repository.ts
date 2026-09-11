import { supabase } from '../../database/supabase';
import type { RestaurantSettings } from '../../database/types';

export class SettingsRepository {
  async getSettings(): Promise<RestaurantSettings | null> {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as unknown as RestaurantSettings) || null;
  }
}
