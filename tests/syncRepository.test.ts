import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../src/db/client';
import * as repo from '../src/repositories/syncRepository';

jest.mock('../src/db/client', () => ({ getDatabase: jest.fn() }));

type FakeDb = {
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  runAsync: jest.Mock;
};

let db: FakeDb;

const fila = {
  id: 'r1',
  remote_id: 'r1',
  nombre: 'Pecho',
  updated_at: 100,
  deleted: 0,
  pending: 1,
};

const serie = {
  id: 's1',
  remote_id: 's1',
  ejercicio: 'Press',
  fecha: '2026-11-21',
  repeticiones: 10,
  peso_g: null,
  updated_at: 100,
  deleted: 0,
  pending: 1,
};

function sql(mock: jest.Mock): string {
  return (mock.mock.calls[0] as [string, unknown[]])[0];
}

beforeEach(() => {
  db = {
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    runAsync: jest.fn().mockResolvedValue(undefined),
  };
  jest.mocked(getDatabase).mockResolvedValue(db as unknown as SQLiteDatabase);
});

describe('syncRepository', () => {
  it('lista filas pendientes de ambas tablas', async () => {
    db.getAllAsync.mockResolvedValueOnce([fila]).mockResolvedValueOnce([serie]);

    await expect(repo.listarPendientes('rutina')).resolves.toEqual([fila]);
    await expect(repo.listarPendientes('serie_hecha')).resolves.toEqual([
      serie,
    ]);

    expect(sql(db.getAllAsync)).toContain('FROM rutina WHERE pending = 1');
    expect(db.getAllAsync.mock.calls[1][0]).toContain(
      'FROM serie_hecha WHERE pending = 1',
    );
  });

  it('busca y marca como sincronizado', async () => {
    db.getFirstAsync.mockResolvedValue(fila);

    await expect(repo.buscarFila('rutina', 'r1')).resolves.toEqual(fila);
    await repo.marcarSincronizado('rutina', 'r1', 100);

    expect(sql(db.getFirstAsync)).toContain('WHERE id = ?');
    expect(sql(db.runAsync)).toContain('pending = 0');
    expect(db.runAsync.mock.calls[0][1]).toEqual(['r1', 100]);
  });

  it('hace upsert de rutinas y series', async () => {
    await repo.upsertRutina(fila);
    await repo.upsertSerie(serie);

    expect(sql(db.runAsync)).toContain('INSERT INTO rutina');
    expect(db.runAsync.mock.calls[1][0]).toContain('INSERT INTO serie_hecha');
  });

  it('borra y sincroniza vínculos y ejercicios', async () => {
    await repo.eliminarVinculosDeRutina('r1');
    await repo.marcarVinculosSincronizados('r1', 100);
    await repo.marcarEjerciciosDeRutinaSincronizados('r1', 100);
    await repo.marcarEjercicioSincronizado('e1', 100);

    expect(db.runAsync).toHaveBeenCalledTimes(4);
    expect(db.runAsync.mock.calls[0][0]).toContain(
      'DELETE FROM rutina_ejercicio',
    );
    expect(db.runAsync.mock.calls[1][0]).toContain(
      'UPDATE rutina_ejercicio SET pending = 0',
    );
    expect(db.runAsync.mock.calls[2][0]).toContain('UPDATE ejercicio');
    expect(db.runAsync.mock.calls[3][1]).toEqual(['e1', 100]);
  });
});
