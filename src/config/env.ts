import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  HOST: z
    .string()
    .default('0.0.0.0')
    .transform((val) => (val === '127.0.0.0' ? '0.0.0.0' : val)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z
    .string()
    .url('SUPABASE_URL deve ser uma URL válida')
    .transform((url) => url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY é obrigatória'),
  CORS_ORIGIN: z.string().default('*'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  const formatted = JSON.stringify(_env.error.format(), null, 2);
  console.error('❌ Configuração inválida de variáveis de ambiente:\n', formatted);
  throw new Error(`Configuração inválida de variáveis de ambiente: ${formatted}`);
}

export const env = _env.data;
