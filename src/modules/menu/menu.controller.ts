import type { FastifyReply, FastifyRequest } from 'fastify';
import { MenuService } from './menu.service';

export class MenuController {
  constructor(private readonly menuService = new MenuService()) {}

  getTodayMenu = async (_request: FastifyRequest, reply: FastifyReply) => {
    const todayMenu = await this.menuService.getTodayMenu();
    return reply.status(200).send(todayMenu);
  };

  getWeeklyMenu = async (_request: FastifyRequest, reply: FastifyReply) => {
    const weeklyMenu = await this.menuService.getWeeklyMenu();
    return reply.status(200).send(weeklyMenu);
  };
}
