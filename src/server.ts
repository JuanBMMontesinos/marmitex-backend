import { buildApp } from './app';
import { env } from './config/env';

async function bootstrap() {
  const app = buildApp();

  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log('\n======================================================');
    console.log(`🚀 Marmitex Backend API iniciado com sucesso!`);
    console.log(`📡 Servidor rodando em: http://${env.HOST}:${env.PORT}`);
    console.log(`📚 Documentação Swagger: http://${env.HOST}:${env.PORT}/docs`);
    console.log(`💓 Health check: http://${env.HOST}:${env.PORT}/health`);
    console.log('======================================================\n');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Encerramento gracioso
  const gracefulShutdown = async (signal: string) => {
    console.log(`\nRecebido sinal ${signal}. Encerrando o servidor de forma graciosa...`);
    try {
      await app.close();
      console.log('Servidor encerrado.');
      process.exit(0);
    } catch (err) {
      console.error('Erro ao encerrar servidor:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap();
