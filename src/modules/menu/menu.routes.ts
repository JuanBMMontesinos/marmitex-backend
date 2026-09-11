import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { MenuController } from './menu.controller';
import { todayMenuResponseSchema, weeklyMenuResponseSchema } from './menu.schema';

export async function menuRoutes(app: FastifyInstance) {
  const controller = new MenuController();

  app.withTypeProvider<ZodTypeProvider>().get(
    '/menu/today',
    {
      schema: {
        tags: ['Cardápio'],
        summary: 'Obter cardápio do dia atual',
        description:
          'Detecta o dia da semana atual no fuso de São Paulo. Se for domingo, retorna isOpen=false. Retorna pratos do dia, bebidas e adicionais.',
        response: {
          200: todayMenuResponseSchema,
        },
      },
    },
    controller.getTodayMenu
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    '/menu/weekly',
    {
      schema: {
        tags: ['Cardápio'],
        summary: 'Obter cardápio semanal completo',
        description:
          'Retorna o cardápio agrupado por dia da semana (Segunda a Sábado) para o modo consulta do aplicativo.',
        response: {
          200: weeklyMenuResponseSchema,
        },
      },
    },
    controller.getWeeklyMenu
  );
}
