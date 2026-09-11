import type { FastifyReply, FastifyRequest } from 'fastify';
import { SettingsService } from './settings.service';

export class SettingsController {
  constructor(private readonly settingsService = new SettingsService()) {}

  getSettings = async (_request: FastifyRequest, reply: FastifyReply) => {
    const settings = await this.settingsService.getSettings();
    return reply.status(200).send(settings);
  };
}
