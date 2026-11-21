import * as Crypto from 'expo-crypto';
import type { RutinaRow, SerieHechaRow, SyncRow } from '../db/types';
import * as ejercicios from '../repositories/ejercicioRepository';
import * as vinculos from '../repositories/rutinaRepository';
import * as syncRepo from '../repositories/syncRepository';
import {
  validateNombre,
  validateSeries,
  validateSerie,
} from '../services/validation';
import type {
  BaseRemota,
  EjercicioRemoto,
  FechaRemota,
  RespuestaPull,
  RutinaRemota,
  SerieRemota,
} from './syncTipos';

export function idDe(item: BaseRemota): string {
  return item.id ?? item.remote_id ?? '';
}

export function aMilis(valor: FechaRemota): number {
  if (typeof valor === 'number') {
    return valor;
  }
  if (typeof valor === 'string') {
    return Date.parse(valor);
  }
  return 0;
}

export function actualizadoDe(item: BaseRemota): number {
  return aMilis(item.updated_at ?? item.updatedAt);
}

export function estaBorrado(item: BaseRemota): boolean {
  return item.deleted === true || item.deleted_at != null;
}

export function debeAplicar(local: SyncRow | null, remoto: number): boolean {
  if (!local) {
    return true;
  }
  if (local.pending === 1 && local.updated_at > remoto) {
    return false;
  }
  return remoto >= local.updated_at;
}

async function obtenerIdEjercicio(
  nombre: string,
  updatedAt: number,
): Promise<string> {
  const existente = await ejercicios.buscarEjercicioPorNombre(nombre);
  if (existente) {
    await syncRepo.marcarEjercicioSincronizado(existente.id, updatedAt);
    return existente.id;
  }
  const id = Crypto.randomUUID();
  await ejercicios.insertarEjercicio({
    id,
    remote_id: id,
    nombre,
    updated_at: updatedAt,
    deleted: 0,
    pending: 0,
  });
  return id;
}

async function reemplazarEjercicios(
  rutinaId: string,
  lista: EjercicioRemoto[],
  updatedAt: number,
): Promise<void> {
  await syncRepo.eliminarVinculosDeRutina(rutinaId);
  for (const [indice, ejercicio] of lista.entries()) {
    const nombre = validateNombre(ejercicio.nombre);
    const series = validateSeries(ejercicio.series);
    const ejercicioId = await obtenerIdEjercicio(nombre, updatedAt);
    const id = Crypto.randomUUID();
    await vinculos.insertarVinculo({
      id,
      remote_id: id,
      rutina_id: rutinaId,
      ejercicio_id: ejercicioId,
      series,
      orden: indice + 1,
      updated_at: updatedAt,
      deleted: 0,
      pending: 0,
    });
  }
}

export async function aplicarRutinas(items: RutinaRemota[]): Promise<number> {
  let aplicadas = 0;
  for (const item of items) {
    const id = idDe(item);
    if (!id) {
      continue;
    }
    const local = await syncRepo.buscarFila<RutinaRow>('rutina', id);
    const actualizado = actualizadoDe(item);
    if (!debeAplicar(local, actualizado)) {
      continue;
    }
    if (estaBorrado(item)) {
      await syncRepo.upsertRutina({
        id,
        remote_id: id,
        nombre: local?.nombre ?? validateNombre(item.nombre),
        updated_at: actualizado,
        deleted: 1,
        pending: 0,
      });
      await syncRepo.eliminarVinculosDeRutina(id);
    } else {
      await syncRepo.upsertRutina({
        id,
        remote_id: id,
        nombre: validateNombre(item.nombre),
        updated_at: actualizado,
        deleted: 0,
        pending: 0,
      });
      await reemplazarEjercicios(id, item.ejercicios ?? [], actualizado);
    }
    aplicadas += 1;
  }
  return aplicadas;
}

export async function aplicarSeries(items: SerieRemota[]): Promise<number> {
  let aplicadas = 0;
  for (const item of items) {
    const id = idDe(item);
    if (!id) {
      continue;
    }
    const local = await syncRepo.buscarFila<SerieHechaRow>('serie_hecha', id);
    const actualizado = actualizadoDe(item);
    if (!debeAplicar(local, actualizado)) {
      continue;
    }
    if (estaBorrado(item)) {
      await syncRepo.upsertSerie({
        id,
        remote_id: id,
        ejercicio: local?.ejercicio ?? item.ejercicio,
        fecha: local?.fecha ?? item.fecha,
        repeticiones: local?.repeticiones ?? item.repeticiones,
        peso_g: local?.peso_g ?? item.peso_g,
        updated_at: actualizado,
        deleted: 1,
        pending: 0,
      });
    } else {
      const validada = validateSerie({
        ejercicio: item.ejercicio,
        fecha: item.fecha,
        repeticiones: item.repeticiones,
        pesoG: item.peso_g ?? undefined,
      });
      await syncRepo.upsertSerie({
        id,
        remote_id: id,
        ejercicio: validada.ejercicio,
        fecha: validada.fecha,
        repeticiones: validada.repeticiones,
        peso_g: validada.pesoG,
        updated_at: actualizado,
        deleted: 0,
        pending: 0,
      });
    }
    aplicadas += 1;
  }
  return aplicadas;
}

export function fechaCursor(
  respuesta: RespuestaPull<unknown>,
  anterior: string,
): string {
  return respuesta.servidor_ahora ?? respuesta.servidorAhora ?? anterior;
}

export function mayor(a: string, b: string): string {
  return Date.parse(a) >= Date.parse(b) ? a : b;
}
