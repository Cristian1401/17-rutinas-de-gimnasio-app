export type EjercicioInput = {
  nombre: string;
  series: number;
};

export type RutinaInput = {
  nombre: string;
  ejercicios: EjercicioInput[];
};

export type EjercicioDetalle = {
  id: string;
  ejercicioId: string;
  nombre: string;
  series: number;
  orden: number;
};

export type Rutina = {
  id: string;
  nombre: string;
  ejercicios: EjercicioDetalle[];
  updatedAt: number;
  pending: boolean;
};

export type Ejercicio = {
  id: string;
  nombre: string;
  updatedAt: number;
  pending: boolean;
};

export type SerieHechaInput = {
  ejercicio: string;
  fecha: string;
  repeticiones: number;
  pesoG?: number;
};

export type SerieHecha = SerieHechaInput & {
  id: string;
  updatedAt: number;
  pending: boolean;
};
