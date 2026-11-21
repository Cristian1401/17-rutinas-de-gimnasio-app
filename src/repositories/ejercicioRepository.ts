import { getDatabase } from '../db/client';
import type { EjercicioRow } from '../db/types';

export async function listarEjercicios(): Promise<EjercicioRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<EjercicioRow>(
    'SELECT * FROM ejercicio WHERE deleted = 0 ORDER BY nombre COLLATE NOCASE',
  );
}

export async function buscarEjercicio(
  id: string,
): Promise<EjercicioRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<EjercicioRow>(
    'SELECT * FROM ejercicio WHERE id = ? AND deleted = 0',
    [id],
  );
}

export async function buscarEjercicioPorNombre(
  nombre: string,
): Promise<EjercicioRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<EjercicioRow>(
    'SELECT * FROM ejercicio WHERE nombre = ? AND deleted = 0',
    [nombre],
  );
}

export async function insertarEjercicio(row: EjercicioRow): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO ejercicio (id, remote_id, nombre, updated_at, deleted, pending)
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

export async function renombrarEjercicio(
  id: string,
  nombre: string,
  updatedAt: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ejercicio SET nombre = ?, updated_at = ?, pending = 1
     WHERE id = ? AND deleted = 0`,
    [nombre, updatedAt, id],
  );
}

export async function eliminarEjercicio(
  id: string,
  updatedAt: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE ejercicio SET deleted = 1, updated_at = ?, pending = 1 WHERE id = ?',
    [updatedAt, id],
  );
}
