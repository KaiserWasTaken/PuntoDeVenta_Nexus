export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(request, response) {
  response.status(404).json({
    error: 'Ruta no encontrada',
    path: request.originalUrl
  });
}

export function errorHandler(error, request, response, _next) {
  console.error({
    name: error?.name,
    message: error?.message,
    stack: error?.stack
  });

  if (error?.name === 'ZodError') {
    return response.status(400).json({
      error: 'Solicitud inválida',
      details: error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message
      }))
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'JSON inválido' });
  }

  const statusCode = error.statusCode ?? 500;
  return response.status(statusCode).json({
    error: statusCode >= 500 ? 'Error interno del servidor' : error.message
  });
}
