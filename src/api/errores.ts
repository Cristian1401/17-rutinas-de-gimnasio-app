export class ApiError extends Error {
  readonly status: number;

  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function mensajeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error inesperado';
}
