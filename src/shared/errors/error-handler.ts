import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './app-error';

export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  // Custom App Error
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.name,
      message: error.message,
      details: error.details,
    });
  }

  // Zod Validation Error
  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Erro de validação nos dados fornecidos',
      issues: error.flatten().fieldErrors,
    });
  }

  // Fastify Schema Validation Error
  if ('validation' in error && error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: error.message || 'Erro de validação nos parâmetros da requisição',
      issues: error.validation,
    });
  }

  // Supabase / Postgrest Error (check properties)
  const anyError = error as unknown as { code?: string; details?: string; hint?: string };
  if (anyError?.code && typeof anyError.code === 'string') {
    if (anyError.code === 'PGRST116') {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Registro não encontrado no banco de dados',
      });
    }

    if (anyError.code === '23505') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Registro duplicado encontrado',
        details: anyError.details,
      });
    }
  }

  // Fallback 500 Internal Server Error
  const statusCode = (error as FastifyError).statusCode || 500;
  return reply.status(statusCode).send({
    statusCode,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Ocorreu um erro interno no servidor.'
      : error.message || 'Erro interno',
  });
}
