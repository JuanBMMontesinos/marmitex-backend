import type { DayOfWeek } from '../../database/types';

export const SAO_PAULO_TZ = 'America/Sao_Paulo';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'DOMINGO',
  1: 'SEGUNDA',
  2: 'TERCA',
  3: 'QUARTA',
  4: 'QUINTA',
  5: 'SEXTA',
  6: 'SABADO',
};

export const DAY_NAMES_PT: Record<DayOfWeek, string> = {
  DOMINGO: 'Domingo',
  SEGUNDA: 'Segunda-feira',
  TERCA: 'Terça-feira',
  QUARTA: 'Quarta-feira',
  QUINTA: 'Quinta-feira',
  SEXTA: 'Sexta-feira',
  SABADO: 'Sábado',
  TODOS_OS_DIAS: 'Todos os Dias',
};

/**
 * Retorna a data/hora atual no fuso horário de São Paulo
 */
export function getNowInSaoPaulo(): Date {
  const now = new Date();
  const spString = now.toLocaleString('en-US', { timeZone: SAO_PAULO_TZ });
  return new Date(spString);
}

/**
 * Retorna o dia da semana atual no fuso horário de São Paulo
 */
export function getCurrentDayOfWeek(date = new Date()): DayOfWeek {
  const spDate = new Date(date.toLocaleString('en-US', { timeZone: SAO_PAULO_TZ }));
  const dayIndex = spDate.getDay();
  return DAY_MAP[dayIndex] || 'SEGUNDA';
}

/**
 * Verifica se o restaurante está no horário de atendimento
 */
export function isWithinBusinessHours(
  openingTimeStr?: string | null,
  closingTimeStr?: string | null,
  currentDate = new Date()
): boolean {
  if (!openingTimeStr || !closingTimeStr) return true;

  const spDate = new Date(currentDate.toLocaleString('en-US', { timeZone: SAO_PAULO_TZ }));
  const currentMinutes = spDate.getHours() * 60 + spDate.getMinutes();

  const [openH, openM] = openingTimeStr.split(':').map(Number);
  const [closeH, closeM] = closingTimeStr.split(':').map(Number);

  const openTotal = (openH ?? 0) * 60 + (openM ?? 0);
  const closeTotal = (closeH ?? 0) * 60 + (closeM ?? 0);

  return currentMinutes >= openTotal && currentMinutes <= closeTotal;
}

/**
 * Retorna string formatada de data/hora para o fuso de SP
 */
export function formatToSaoPauloIso(date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TZ,
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
}
