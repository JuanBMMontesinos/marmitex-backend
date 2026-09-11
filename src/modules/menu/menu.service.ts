import { MenuRepository } from './menu.repository';
import { SettingsRepository } from '../settings/settings.repository';
import type {
  MenuItemDto,
  MenuAddonDto,
  TodayMenuResponse,
  WeeklyMenuResponse,
} from './menu.schema';
import {
  DAY_NAMES_PT,
  getCurrentDayOfWeek,
  isWithinBusinessHours,
} from '../../shared/utils/date';
import type { MenuItem, MenuAddon } from '../../database/types';

export class MenuService {
  constructor(
    private readonly menuRepository = new MenuRepository(),
    private readonly settingsRepository = new SettingsRepository()
  ) {}

  private mapMenuItem(item: MenuItem): MenuItemDto {
    return {
      id: item.id,
      category: item.category,
      day_of_week: item.day_of_week,
      option_label: item.option_label,
      name: item.name,
      ingredients: item.ingredients,
      has_salad: Boolean(item.has_salad),
      price: Number(item.price),
      image_url: item.image_url,
      is_available: item.is_available,
      display_order: item.display_order,
    };
  }

  private mapAddon(addon: MenuAddon): MenuAddonDto {
    return {
      id: addon.id,
      name: addon.name,
      price: Number(addon.price),
      is_available: addon.is_available,
      display_order: addon.display_order,
    };
  }

  async getTodayMenu(): Promise<TodayMenuResponse> {
    const currentDay = getCurrentDayOfWeek();
    const dayName = DAY_NAMES_PT[currentDay];

    // Se for domingo, a marmitaria está fechada
    if (currentDay === 'DOMINGO') {
      return {
        day_of_week: currentDay,
        day_name: dayName,
        is_open: false,
        message: 'A marmitaria não funciona aos domingos. Esperamos você de segunda a sábado!',
        dishes: [],
        beverages: [],
        addons: [],
      };
    }

    const [settings, items, addons] = await Promise.all([
      this.settingsRepository.getSettings(),
      this.menuRepository.getItemsForDay(currentDay),
      this.menuRepository.getActiveAddons(),
    ]);

    const isScheduleActive = settings
      ? isWithinBusinessHours(settings.opening_time, settings.closing_time)
      : true;
    const isRestaurantOpen = (settings ? settings.is_open : true) && isScheduleActive;

    const dishes = items
      .filter((item) => item.category === 'PRATO_DO_DIA')
      .map(this.mapMenuItem);

    const beverages = items
      .filter((item) => item.category === 'BEBIDA')
      .map(this.mapMenuItem);

    const mappedAddons = addons.map(this.mapAddon);

    return {
      day_of_week: currentDay,
      day_name: dayName,
      is_open: isRestaurantOpen,
      message: isRestaurantOpen ? undefined : 'No momento a marmitaria está fechada para novos pedidos.',
      dishes,
      beverages,
      addons: mappedAddons,
    };
  }

  async getWeeklyMenu(): Promise<WeeklyMenuResponse> {
    const weekdays: Array<'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO'> = [
      'SEGUNDA',
      'TERCA',
      'QUARTA',
      'QUINTA',
      'SEXTA',
      'SABADO',
    ];

    const [allItems, addons] = await Promise.all([
      this.menuRepository.getAllActiveItems(),
      this.menuRepository.getActiveAddons(),
    ]);

    const weeklySchedule = weekdays.map((day) => {
      const dayDishes = allItems
        .filter(
          (item) =>
            item.category === 'PRATO_DO_DIA' &&
            (item.day_of_week === day || item.day_of_week === 'TODOS_OS_DIAS')
        )
        .map(this.mapMenuItem);

      return {
        day_of_week: day,
        day_name: DAY_NAMES_PT[day],
        dishes: dayDishes,
      };
    });

    const beverages = allItems
      .filter((item) => item.category === 'BEBIDA')
      .map(this.mapMenuItem);

    const mappedAddons = addons.map(this.mapAddon);

    return {
      weekly_schedule: weeklySchedule,
      beverages,
      addons: mappedAddons,
    };
  }
}
