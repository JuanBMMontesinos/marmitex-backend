import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { env } from './config/env';
import { errorHandler } from './shared/errors/error-handler';

import { menuRoutes } from './modules/menu/menu.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { deliveryZoneRoutes } from './modules/delivery-zones/delivery-zone.routes';
import { ordersRoutes } from './modules/orders/orders.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';

export function buildApp() {
  const app = fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  }).withTypeProvider<ZodTypeProvider>();

  // Configura compilador e serializador Zod
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Tratamento Global de Erros
  app.setErrorHandler(errorHandler);

  // CORS
  app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Swagger / OpenAPI 3.0
  app.register(swagger, {
    openapi: {
      info: {
        title: 'Marmitaria do Dia API',
        description:
          'API RESTful de alta performance para o aplicativo de delivery de marmitas (Android) e painel web da cozinha (Backoffice). Conectada diretamente ao Supabase.',
        version: '1.0.0',
        contact: {
          name: 'Suporte Marmitaria do Dia',
          email: 'suporte@marmitariadodia.com.br',
        },
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Ambiente Local de Desenvolvimento',
        },
      ],
      tags: [
        { name: 'Cardápio', description: 'Endpoints para consulta do cardápio diário e semanal' },
        { name: 'Configurações', description: 'Informações do restaurante e horários de atendimento' },
        { name: 'Taxas e Bairros', description: 'Zonas de entrega e cálculo de frete' },
        { name: 'Pedidos & Checkout', description: 'Criação e consulta detalhada de pedidos' },
        { name: 'Pedidos & Backoffice', description: 'Operações de atualização de status para a cozinha' },
        { name: 'Pagamentos & Webhook', description: 'Webhooks e transações de pagamento via PIX/Gateway' },
      ],
    },
    transform: jsonSchemaTransform,
  });

  // Swagger UI
  app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Rota raiz: Redireciona automaticamente para o Swagger (/docs)
  app.get('/', async (_request, reply) => {
    return reply.redirect('/docs', 302);
  });

  // Favicon silencioso
  app.get('/favicon.ico', async (_request, reply) => {
    return reply.status(204).send();
  });

  // Rota de Health Check
  app.get('/health', async () => {
    return {
      status: 'OK',
      service: 'marmitex-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Rotas da API v1
  app.register(
    async (apiV1) => {
      await apiV1.register(menuRoutes);
      await apiV1.register(settingsRoutes);
      await apiV1.register(deliveryZoneRoutes);
      await apiV1.register(ordersRoutes);
      await apiV1.register(paymentsRoutes);
    },
    { prefix: '/api/v1' }
  );

  return app;
}
