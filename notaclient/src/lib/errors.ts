export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class RobotCredentialsMissingError extends AppError {
  constructor() {
    super("Credenciais do robô não configuradas para o prestador atual.", 428);
    this.name = "RobotCredentialsMissingError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
