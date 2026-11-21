import { getDatabase } from '../db/client';
import type { SerieHechaRow } from '../db/types';

export async function listarSeries(
  ejercicio?: string,
): Promise<SerieHechaRow[]> {
  const db = await getDatabase();
  const sql = ejercicio
    ? `SELECT * FROM serie_hecha
       WHERE deleted = 0 AND ejercicio = ?
       ORDER BY fecha DESC, updated_at DESC`
    : `SELECT * FROM serie_hecha
       WHERE deleted = 0
       ORDER BY fecha DESC, updated_at DESC`;
  return db.getAllAsync<SerieHechaRow>(sql, ejercicio ? [ejercicio] : []);
}

export async function insertarSerie(row: SerieHechaRow): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO serie_hecha
     (id, remote_id, ejercicio, fecha, repeticiones, peso_g, updated_at, deleted, pending)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

export async function actualizarSerie(
  id: string,
  ejercicio: string,
  fecha: string,
  repeticiones: number,
  pesoG: number | null,
  updatedAt: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE serie_hecha
     SET ejercicio = ?, fecha = ?, repeticiones = ?, peso_g = ?,
         updated_at = ?, pending = 1
     WHERE id = ? AND deleted = 0`,
    [ejercicio, fecha, repeticiones, pesoG, updatedAt, id],
  );
}

export async function eliminarSerie(
  id: string,
  updatedAt: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE serie_hecha SET deleted = 1, updated_at = ?, pending = 1 WHERE id = ?',
    [updatedAt, id],
  );
}
