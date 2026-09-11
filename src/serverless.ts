import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from './app';

let appPromise: Promise<any> | null = null;

async function getFastifyApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const app = buildApp();
      await app.ready();
      return app;
    })();
  }
  return appPromise;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  const app = await getFastifyApp();
  app.server.emit('request', req, res);
}
