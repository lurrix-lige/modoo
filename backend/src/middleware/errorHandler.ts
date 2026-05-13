import { FastifyError, FastifyReply } from 'fastify';
import { AppError } from '../utils/errors';
import { errorResponse, ErrorCodes } from '../utils/apiResponse';

export async function errorHandler(
  error: FastifyError | AppError,
  request: any,
  reply: FastifyReply
) {
  const requestId = request.id || request.headers['x-request-id'] || generateRequestId();
  
  request.log.error({ 
    error, 
    requestId, 
    path: request.url, 
    method: request.method 
  });

  if (error instanceof AppError) {
    const response = errorResponse(
      error.code as any,
      error.message,
      error.details,
      requestId
    );
    return reply.code(error.statusCode).send(response);
  }

  if (error.validation) {
    const details = error.validation.map((v: any) => ({
      field: v.instancePath || v.params?.missingProperty || 'unknown',
      message: v.message || '验证失败',
      value: v.value,
    }));
    const response = errorResponse(
      ErrorCodes.VALIDATION_INVALID_FORMAT,
      error.message || '请求参数验证失败',
      details,
      requestId
    );
    return reply.code(400).send(response);
  }

  if (error.statusCode) {
    const response = errorResponse(
      error.code as any || ErrorCodes.UNKNOWN_ERROR,
      error.message,
      undefined,
      requestId
    );
    return reply.code(error.statusCode).send(response);
  }

  const response = errorResponse(
    ErrorCodes.SYS_INTERNAL_ERROR,
    '服务器内部错误，请稍后再试',
    undefined,
    requestId
  );
  return reply.code(500).send(response);
}

function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

export function requestIdMiddleware(request: any, reply: any, done: any) {
  const requestId = request.headers['x-request-id'] || generateRequestId();
  request.id = requestId;
  reply.header('X-Request-Id', requestId);
  done();
}
