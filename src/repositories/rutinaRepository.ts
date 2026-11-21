import { getDatabase } from '../db/client';
import type {
  RutinaEjercicioDetalleRow,
  RutinaEjercicioRow,
  RutinaRow,
} from '../db/types';

export async function listarRutinas(): Promise<RutinaRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<RutinaRow>(
    'SELECT * FROM rutina WHERE deleted = 0 ORDER BY nombre COLLATE NOCASE',
  );
}

export async function buscarRutina(id: string): Promise<RutinaRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<RutinaRow>(
    'SELECT * FROM rutina WHERE id = ? AND deleted = 0',
    [id],
  );
}

export async function insertarRutina(row: RutinaRow): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO rutina (id, remote_id, nombre, updated_at, deleted, pending)
     VALUES (?, ?, ?, ?, ?, ?)`,
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

export async function renombrarRutina(
  id: string,
  nombre: string,
  updatedAt: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE rutina SET nombre = ?, updated_at = ?, pending = 1
     WHERE id = ? AND deleted = 0`,
    [nombre, updatedAt, id],
  );
}

export async function eliminarRutina(
  id: string,
  updatedAt: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE rutina SET deleted = 1, updated_at = ?, pending = 1 WHERE id = ?',
    [updatedAt, id],
  );
}

export async function listarEjerciciosDeRutina(
  rutinaId: string,
): Promise<RutinaEjercicioDetalleRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<RutinaEjercicioDetalleRow>(
    `SELECT v.*, e.nombre AS ejercicio_nombre
     FROM rutina_ejercicio v
     JOIN ejercicio e ON e.id = v.ejercicio_id AND e.deleted = 0
     WHERE v.rutina_id = ? AND v.deleted = 0
     ORDER BY v.orden`,
    [rutinaId],
  );
}

export async function insertarVinculo(row: RutinaEjercicioRow): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO rutina_ejercicio
     (id, remote_id, rutina_id, ejercicio_id, series, orden, updated_at, deleted, pending)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.remote_id,
      row.rutina_id,
      row.ejercicio_id,
      row.series,
      row.orden,
      row.updated_at,
      row.deleted,
      row.pending,
    ],
  );
}

export async function actualizarVinculo(
  id: string,
  series: number,
  updatedAt: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE rutina_ejercicio SET series = ?, updated_at = ?, pending = 1
     WHERE id = ? AND deleted = 0`,
    [series, updatedAt, id],
  );
}

export async function eliminarVinculo(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM rutina_ejercicio WHERE id = ?', [id]);
}

export async function eliminarVinculosDeEjercicio(
  ejercicioId: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM rutina_ejercicio WHERE ejercicio_id = ?', [
    ejercicioId,
  ]);
}
