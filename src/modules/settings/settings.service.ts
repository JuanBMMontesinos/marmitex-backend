import { SettingsRepository } from './settings.repository';
import type { RestaurantSettingsResponse } from './settings.schema';
import { getCurrentDayOfWeek, isWithinBusinessHours } from '../../shared/utils/date';

export class SettingsService {
  constructor(private readonly settingsRepository = new SettingsRepository()) {}

  async getSettings(): Promise<RestaurantSettingsResponse> {
    const settings = await this.settingsRepository.getSettings();

    if (!settings) {
      // Configuração padrão de contingência
      return {
        id: 1,
        name: 'Marmitaria do Dia',
        is_open: true,
        opening_time: '11:00',
        closing_time: '14:30',
        phone_whatsapp: '11999999999',
        pix_key: 'contato@marmitariadodia.com.br',
        address_text: 'Rua Principal, 123 - Centro',
        takeout_open_time: '11:00',
        currently_open: true,
      };
    }

    const currentDay = getCurrentDayOfWeek();
    const isSunday = currentDay === 'DOMINGO';
    const isScheduleActive = isWithinBusinessHours(settings.opening_time, settings.closing_time);
    const currentlyOpen = settings.is_open && !isSunday && isScheduleActive;

    return {
      id: settings.id,
      name: settings.name,
      is_open: settings.is_open,
      opening_time: settings.opening_time,
      closing_time: settings.closing_time,
      phone_whatsapp: settings.phone_whatsapp,
      pix_key: settings.pix_key,
      address_text: settings.address_text,
      takeout_open_time: settings.takeout_open_time,
      currently_open: currentlyOpen,
    };
  }
}
