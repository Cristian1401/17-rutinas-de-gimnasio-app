import * as Crypto from 'expo-crypto';
import type { EjercicioRow } from '../db/types';
import * as repository from '../repositories/ejercicioRepository';
import * as vinculos from '../repositories/rutinaRepository';
import type { Ejercicio } from './types';
import { validateNombre } from './validation';

function mapEjercicio(row: EjercicioRow): Ejercicio {
  return {
    id: row.id,
    nombre: row.nombre,
    updatedAt: row.updated_at,
    pending: row.pending === 1,
  };
}

async function requireEjercicio(id: string): Promise<EjercicioRow> {
  const row = await repository.buscarEjercicio(id);
  if (!row) {
    throw new Error('Ejercicio no encontrado');
  }
  return row;
}

export async function listarEjercicios(): Promise<Ejercicio[]> {
  const rows = await repository.listarEjercicios();
  return rows.map(mapEjercicio);
}

export async function crearEjercicio(nombre: string): Promise<Ejercicio> {
  const value = validateNombre(nombre);
  const id = Crypto.randomUUID();
  const updatedAt = Date.now();
  await repository.insertarEjercicio({
    id,
    remote_id: id,
    nombre: value,
    updated_at: updatedAt,
    deleted: 0,
    pending: 1,
  });
  return { id, nombre: value, updatedAt, pending: true };
}

export async function renombrarEjercicio(
  id: string,
  nombre: string,
): Promise<void> {
  const value = validateNombre(nombre);
  await requireEjercicio(id);
  await repository.renombrarEjercicio(id, value, Date.now());
}

export async function eliminarEjercicio(id: string): Promise<void> {
  await requireEjercicio(id);
  await vinculos.eliminarVinculosDeEjercicio(id);
  await repository.eliminarEjercicio(id, Date.now());
}
