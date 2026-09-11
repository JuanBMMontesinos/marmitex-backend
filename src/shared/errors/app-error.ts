export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado', details?: unknown) {
    super(message, 404, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Requisição inválida', details?: unknown) {
    super(message, 400, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Erro de validação dos dados', details?: unknown) {
    super(message, 422, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito com o estado atual', details?: unknown) {
    super(message, 409, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado', details?: unknown) {
    super(message, 401, details);
  }
}
