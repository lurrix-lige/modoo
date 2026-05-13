import { ErrorCodes, ErrorCodeType } from './apiResponse';

export { ErrorCodes };

export function customError(
  code: string,
  message: string,
  statusCode: number = 400
): AppError {
  return new AppError(code as ErrorCodeType, message, statusCode);
}

export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly statusCode: number;
  public readonly details?: { field: string; message: string; value?: any }[];

  constructor(
    code: ErrorCodeType,
    message: string,
    statusCode: number = 400,
    details?: { field: string; message: string; value?: any }[]
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(
    code: ErrorCodeType,
    message: string,
    details?: { field: string; message: string; value?: any }[]
  ): AppError {
    return new AppError(code, message, 400, details);
  }

  static unauthorized(message: string): AppError {
    return new AppError(ErrorCodes.AUTH_TOKEN_INVALID, message, 401);
  }

  static forbidden(message: string): AppError {
    return new AppError(ErrorCodes.AUTH_PERMISSION_DENIED, message, 403);
  }

  static notFound(message: string): AppError {
    return new AppError(ErrorCodes.RESOURCE_NOT_FOUND, message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(ErrorCodes.RESOURCE_CONFLICT, message, 409);
  }

  static internal(message: string): AppError {
    return new AppError(ErrorCodes.SYS_INTERNAL_ERROR, message, 500);
  }

  static validationError(
    details: { field: string; message: string; value?: any }[]
  ): AppError {
    return new AppError(
      ErrorCodes.VALIDATION_INVALID_FORMAT,
      '请求参数验证失败',
      400,
      details
    );
  }
}
