import * as Crypto from 'expo-crypto';
import type { SerieHechaRow } from '../db/types';
import * as repository from '../repositories/serieHechaRepository';
import type { SerieHecha, SerieHechaInput } from './types';
import { validateSerie } from './validation';

function mapSerie(row: SerieHechaRow): SerieHecha {
  return {
    id: row.id,
    ejercicio: row.ejercicio,
    fecha: row.fecha,
    repeticiones: row.repeticiones,
    pesoG: row.peso_g ?? undefined,
    updatedAt: row.updated_at,
    pending: row.pending === 1,
  };
}

export async function listarSeries(ejercicio?: string): Promise<SerieHecha[]> {
  const rows = await repository.listarSeries(ejercicio);
  return rows.map(mapSerie);
}

export async function crearSerie(input: SerieHechaInput): Promise<SerieHecha> {
  const values = validateSerie(input);
  const id = Crypto.randomUUID();
  const updatedAt = Date.now();
  await repository.insertarSerie({
    id,
    remote_id: id,
    ejercicio: values.ejercicio,
    fecha: values.fecha,
    repeticiones: values.repeticiones,
    peso_g: values.pesoG,
    updated_at: updatedAt,
    deleted: 0,
    pending: 1,
  });
  return {
    ...values,
    pesoG: values.pesoG ?? undefined,
    id,
    updatedAt,
    pending: true,
  };
}

export async function actualizarSerie(
  id: string,
  input: SerieHechaInput,
): Promise<void> {
  const values = validateSerie(input);
  await repository.actualizarSerie(
    id,
    values.ejercicio,
    values.fecha,
    values.repeticiones,
    values.pesoG,
    Date.now(),
  );
}

export async function eliminarSerie(id: string): Promise<void> {
  await repository.eliminarSerie(id, Date.now());
}
