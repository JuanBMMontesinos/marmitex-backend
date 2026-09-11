import type { IncomingMessage, ServerResponse } from 'node:http';

let appPromise: Promise<any> | null = null;

async function getFastifyApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { buildApp } = await import('../src/app');
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
  try {
    const app = await getFastifyApp();
    app.server.emit('request', req, res);
  } catch (err: any) {
    console.error('❌ ERRO CRÍTICO NA VERCEL:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify(
        {
          error: 'FUNCTION_INVOCATION_DIAGNOSTIC',
          message: err?.message || String(err),
          code: err?.code,
          stack: err?.stack,
          env_check: {
            has_supabase_url: Boolean(process.env.SUPABASE_URL),
            has_supabase_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
            node_env: process.env.NODE_ENV,
          },
        },
        null,
        2
      )
    );
  }
}
