import type { EjercicioInput, SerieHechaInput } from './types';

export type SerieValidada = {
  ejercicio: string;
  fecha: string;
  repeticiones: number;
  pesoG: number | null;
};

export function validateNombre(nombre: string): string {
  const value = nombre.trim();
  if (value.length === 0 || value.length > 80) {
    throw new Error('El nombre debe tener entre 1 y 80 caracteres');
  }
  return value;
}

export function validateSeries(series: number): number {
  if (!Number.isInteger(series) || series < 1 || series > 10) {
    throw new Error('Las series deben estar entre 1 y 10');
  }
  return series;
}

export function validateRepeticiones(repeticiones: number): number {
  if (
    !Number.isInteger(repeticiones) ||
    repeticiones < 1 ||
    repeticiones > 100
  ) {
    throw new Error('Las repeticiones deben estar entre 1 y 100');
  }
  return repeticiones;
}

export function validateFecha(fecha: string): string {
  const date = new Date(`${fecha}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== fecha
  ) {
    throw new Error('La fecha debe tener formato YYYY-MM-DD');
  }
  return fecha;
}

export function validatePeso(pesoG?: number): number | null {
  if (pesoG === undefined) {
    return null;
  }
  if (!Number.isFinite(pesoG) || pesoG < 0) {
    throw new Error('El peso debe ser un número positivo');
  }
  return pesoG;
}

export function validateEjercicios(ejercicios: EjercicioInput[]): void {
  if (ejercicios.length === 0) {
    throw new Error('Añade al menos un ejercicio');
  }
  for (const ejercicio of ejercicios) {
    validateNombre(ejercicio.nombre);
    validateSeries(ejercicio.series);
  }
}

export function validateSerie(input: SerieHechaInput): SerieValidada {
  return {
    ejercicio: validateNombre(input.ejercicio),
    fecha: validateFecha(input.fecha),
    repeticiones: validateRepeticiones(input.repeticiones),
    pesoG: validatePeso(input.pesoG),
  };
}
