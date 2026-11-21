import { getDatabase } from '../db/client';
import type { RutinaRow, SerieHechaRow, SyncRow } from '../db/types';

const TABLAS = {
  rutina: 'rutina',
  serie_hecha: 'serie_hecha',
} as const;

export type TablaSync = keyof typeof TABLAS;

export async function listarPendientes<T extends SyncRow>(
  tabla: TablaSync,
): Promise<T[]> {
  const db = await getDatabase();
  return db.getAllAsync<T>(
    `SELECT * FROM ${TABLAS[tabla]} WHERE pending = 1 ORDER BY updated_at`,
  );
}

export async function buscarFila<T extends SyncRow>(
  tabla: TablaSync,
  id: string,
): Promise<T | null> {
  const db = await getDatabase();
  return db.getFirstAsync<T>(`SELECT * FROM ${TABLAS[tabla]} WHERE id = ?`, [
    id,
  ]);
}

export async function marcarSincronizado(
  tabla: TablaSync,
  id: string,
  updatedAt: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${TABLAS[tabla]} SET pending = 0 WHERE id = ? AND updated_at = ?`,
    [id, updatedAt],
  );
}

export async function upsertRutina(row: RutinaRow): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO rutina (id, remote_id, nombre, updated_at, deleted, pending)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       remote_id = excluded.remote_id,
       nombre = excluded.nombre,
       updated_at = excluded.updated_at,
       deleted = excluded.deleted,
       pending = excluded.pending`,
    [
      row.id,
      row.remote_id,
      row.nombre,
      row.updated_at,
      row.deleted,
      row.pending,
    ],
  );
}

export async function upsertSerie(row: SerieHechaRow): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO serie_hecha
       (id, remote_id, ejercicio, fecha, repeticiones, peso_g, updated_at, deleted, pending)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       remote_id = excluded.remote_id,
       ejercicio = excluded.ejercicio,
       fecha = excluded.fecha,
       repeticiones = excluded.repeticiones,
       peso_g = excluded.peso_g,
       updated_at = excluded.updated_at,
       deleted = excluded.deleted,
       pending = excluded.pending`,
    [
      row.id,
      row.remote_id,
      row.ejercicio,
      row.fecha,
      row.repeticiones,
      row.peso_g,
      row.updated_at,
      row.deleted,
      row.pending,
    ],
  );
}

export async function eliminarVinculosDeRutina(
  rutinaId: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM rutina_ejercicio WHERE rutina_id = ?', [
    rutinaId,
  ]);
}

export async function marcarVinculosSincronizados(
  rutinaId: string,
  updatedAt: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE rutina_ejercicio SET pending = 0
     WHERE rutina_id = ? AND updated_at <= ?`,
    [rutinaId, updatedAt],
  );
}

export async function marcarEjerciciosDeRutinaSincronizados(
  rutinaId: string,
  updatedAt: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ejercicio SET pending = 0
     WHERE updated_at <= ? AND id IN (
       SELECT ejercicio_id FROM rutina_ejercicio WHERE rutina_id = ?
     )`,
    [updatedAt, rutinaId],
  );
}

export async function marcarEjercicioSincronizado(
  id: string,
  updatedAt: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE ejercicio SET pending = 0 WHERE id = ? AND updated_at <= ?',
    [id, updatedAt],
  );
}
