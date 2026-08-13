export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toAppError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  if (e instanceof Error) return new AppError(e.message, 'UNKNOWN');
  return new AppError('Something went wrong.', 'UNKNOWN');
}
