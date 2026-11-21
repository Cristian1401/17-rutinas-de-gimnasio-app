import * as Crypto from 'expo-crypto';
import type { RutinaEjercicioDetalleRow, RutinaRow } from '../db/types';
import * as repository from '../repositories/rutinaRepository';
import * as ejercicioService from './ejercicioService';
import type { EjercicioDetalle, Rutina, RutinaInput } from './types';
import {
  validateEjercicios,
  validateNombre,
  validateSeries,
} from './validation';

function mapEjercicio(row: RutinaEjercicioDetalleRow): EjercicioDetalle {
  return {
    id: row.id,
    ejercicioId: row.ejercicio_id,
    nombre: row.ejercicio_nombre,
    series: row.series,
    orden: row.orden,
  };
}

async function mapRutina(row: RutinaRow): Promise<Rutina> {
  const ejercicios = await repository.listarEjerciciosDeRutina(row.id);
  return {
    id: row.id,
    nombre: row.nombre,
    ejercicios: ejercicios.map(mapEjercicio),
    updatedAt: row.updated_at,
    pending: row.pending === 1,
  };
}

async function requireRutina(id: string): Promise<RutinaRow> {
  const row = await repository.buscarRutina(id);
  if (!row) {
    throw new Error('Rutina no encontrada');
  }
  return row;
}

export async function listarRutinas(): Promise<Rutina[]> {
  const rows = await repository.listarRutinas();
  return Promise.all(rows.map(mapRutina));
}

export async function obtenerRutina(id: string): Promise<Rutina> {
  const row = await requireRutina(id);
  return mapRutina(row);
}

export async function crearRutina(input: RutinaInput): Promise<Rutina> {
  const nombre = validateNombre(input.nombre);
  validateEjercicios(input.ejercicios);
  const id = Crypto.randomUUID();
  await repository.insertarRutina({
    id,
    remote_id: id,
    nombre,
    updated_at: Date.now(),
    deleted: 0,
    pending: 1,
  });
  for (const ejercicio of input.ejercicios) {
    const creado = await ejercicioService.crearEjercicio(ejercicio.nombre);
    await agregarEjercicio(id, creado.id, ejercicio.series);
  }
  return obtenerRutina(id);
}

export async function renombrarRutina(
  id: string,
  nombre: string,
): Promise<void> {
  const value = validateNombre(nombre);
  await requireRutina(id);
  await repository.renombrarRutina(id, value, Date.now());
}

export async function eliminarRutina(id: string): Promise<void> {
  await requireRutina(id);
  await repository.eliminarRutina(id, Date.now());
}

export async function agregarEjercicio(
  rutinaId: string,
  ejercicioId: string,
  series: number,
): Promise<void> {
  const value = validateSeries(series);
  await requireRutina(rutinaId);
  const actuales = await repository.listarEjerciciosDeRutina(rutinaId);
  const id = Crypto.randomUUID();
  await repository.insertarVinculo({
    id,
    remote_id: id,
    rutina_id: rutinaId,
    ejercicio_id: ejercicioId,
    series: value,
    orden: actuales.length + 1,
    updated_at: Date.now(),
    deleted: 0,
    pending: 1,
  });
}

export async function cambiarSeries(
  vinculoId: string,
  series: number,
): Promise<void> {
  const value = validateSeries(series);
  await repository.actualizarVinculo(vinculoId, value, Date.now());
}

export async function quitarEjercicio(vinculoId: string): Promise<void> {
  await repository.eliminarVinculo(vinculoId);
}
