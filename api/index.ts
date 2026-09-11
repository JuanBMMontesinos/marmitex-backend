import type { IncomingMessage, ServerResponse } from 'node:http';

let appInstance: any = null;

async function getFastifyApp() {
  if (!appInstance) {
    const { buildApp } = await import('../src/app');
    const app = buildApp();
    await app.ready();
    appInstance = app;
  }
  return appInstance;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const app = await getFastifyApp();
    app.server.emit('request', req, res);
  } catch (err: any) {
    console.error('❌ Erro na execução da Serverless Function na Vercel:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify(
        {
          error: 'FUNCTION_INITIALIZATION_ERROR',
          message: err?.message || 'Erro ao inicializar a aplicação na Vercel',
          hint: 'Certifique-se de configurar as Environment Variables (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY) nas configurações do projeto na Vercel.',
          stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack,
        },
        null,
        2
      )
    );
  }
}
