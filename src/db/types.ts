export type SyncRow = {
  id: string;
  remote_id: string;
  updated_at: number;
  deleted: number;
  pending: number;
};

export type RutinaRow = SyncRow & {
  nombre: string;
};

export type EjercicioRow = SyncRow & {
  nombre: string;
};

export type RutinaEjercicioRow = SyncRow & {
  rutina_id: string;
  ejercicio_id: string;
  series: number;
  orden: number;
};

export type RutinaEjercicioDetalleRow = RutinaEjercicioRow & {
  ejercicio_nombre: string;
};

export type SerieHechaRow = SyncRow & {
  ejercicio: string;
  fecha: string;
  repeticiones: number;
  peso_g: number | null;
};
