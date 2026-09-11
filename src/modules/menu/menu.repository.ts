import { supabase } from '../../database/supabase';
import type { DayOfWeek, MenuAddon, MenuItem } from '../../database/types';

export class MenuRepository {
  async getItemsForDay(day: DayOfWeek): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .in('day_of_week', [day, 'TODOS_OS_DIAS'])
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    return (data as MenuItem[]) || [];
  }

  async getAllActiveItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    return (data as MenuItem[]) || [];
  }

  async getActiveAddons(): Promise<MenuAddon[]> {
    const { data, error } = await supabase
      .from('menu_addons')
      .select('*')
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    return (data as MenuAddon[]) || [];
  }

  async findItemsByIds(ids: string[]): Promise<MenuItem[]> {
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .in('id', ids);

    if (error) {
      throw error;
    }

    return (data as MenuItem[]) || [];
  }

  async findAddonsByIds(ids: string[]): Promise<MenuAddon[]> {
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('menu_addons')
      .select('*')
      .in('id', ids);

    if (error) {
      throw error;
    }

    return (data as MenuAddon[]) || [];
  }
}
