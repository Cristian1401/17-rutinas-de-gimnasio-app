export type FechaRemota = string | number | null | undefined;

export type BaseRemota = {
  id?: string;
  remote_id?: string;
  updated_at?: FechaRemota;
  updatedAt?: FechaRemota;
  deleted_at?: string | null;
  deleted?: boolean;
};

export type EjercicioRemoto = { nombre: string; series: number };

export type RutinaRemota = BaseRemota & {
  nombre: string;
  ejercicios?: EjercicioRemoto[];
};

export type SerieRemota = BaseRemota & {
  ejercicio: string;
  fecha: string;
  repeticiones: number;
  peso_g: number | null;
};

export type RespuestaPull<T> = {
  items: T[];
  servidor_ahora?: string;
  servidorAhora?: string;
};

export type ResultadoSync = {
  enviadas: number;
  borrados: number;
  descargadas: number;
};

export type Conteo = { enviadas: number; borrados: number };
