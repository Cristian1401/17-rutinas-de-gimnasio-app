import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../src/db/client';
import * as ejercicioRepo from '../src/repositories/ejercicioRepository';
import * as rutinaRepo from '../src/repositories/rutinaRepository';
import * as serieRepo from '../src/repositories/serieHechaRepository';

jest.mock('../src/db/client', () => ({
  getDatabase: jest.fn(),
}));

const mockGetDatabase = jest.mocked(getDatabase);

type FakeDb = {
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  runAsync: jest.Mock;
};

let db: FakeDb;

const rutina = {
  id: 'r1',
  remote_id: 'r1',
  nombre: 'Pecho',
  updated_at: 100,
  deleted: 0,
  pending: 1,
};

const ejercicio = {
  id: 'e1',
  remote_id: 'e1',
  nombre: 'Press banca',
  updated_at: 100,
  deleted: 0,
  pending: 1,
};

const vinculo = {
  id: 'v1',
  remote_id: 'v1',
  rutina_id: 'r1',
  ejercicio_id: 'e1',
  series: 3,
  orden: 1,
  updated_at: 100,
  deleted: 0,
  pending: 1,
};

const serie = {
  id: 's1',
  remote_id: 's1',
  ejercicio: 'Press banca',
  fecha: '2026-11-21',
  repeticiones: 10,
  peso_g: 20,
  updated_at: 100,
  deleted: 0,
  pending: 1,
};

function llamada(
  mock: jest.Mock,
  indice = 0,
): { sql: string; params: unknown[] } {
  const [sql, params] = mock.mock.calls[indice] as [string, unknown[]];
  return { sql, params };
}

beforeEach(() => {
  db = {
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
  };
  mockGetDatabase.mockResolvedValue(db as unknown as SQLiteDatabase);
});

describe('rutinaRepository', () => {
  it('lista y busca rutinas con SQL parametrizado', async () => {
    db.getAllAsync.mockResolvedValue([rutina]);
    db.getFirstAsync.mockResolvedValue(rutina);

    await expect(rutinaRepo.listarRutinas()).resolves.toEqual([rutina]);
    await expect(rutinaRepo.buscarRutina('r1')).resolves.toEqual(rutina);

    expect(llamada(db.getAllAsync).sql).toContain(
      'FROM rutina WHERE deleted = 0',
    );
    expect(llamada(db.getFirstAsync).params).toEqual(['r1']);
  });

  it('inserta, renombra y elimina rutinas', async () => {
    await rutinaRepo.insertarRutina(rutina);
    await rutinaRepo.renombrarRutina('r1', 'Pierna', 200);
    await rutinaRepo.eliminarRutina('r1', 200);

    expect(llamada(db.runAsync).sql).toContain('INSERT INTO rutina');
    expect(llamada(db.runAsync).params).toEqual([
      'r1',
      'r1',
      'Pecho',
      100,
      0,
      1,
    ]);
    expect(llamada(db.runAsync, 1).params).toEqual(['Pierna', 200, 'r1']);
    expect(llamada(db.runAsync, 2).params).toEqual([200, 'r1']);
  });

  it('consulta y modifica los vínculos de una rutina', async () => {
    db.getAllAsync.mockResolvedValue([
      { ...vinculo, ejercicio_nombre: 'Press' },
    ]);

    await expect(rutinaRepo.listarEjerciciosDeRutina('r1')).resolves.toEqual([
      { ...vinculo, ejercicio_nombre: 'Press' },
    ]);
    await rutinaRepo.insertarVinculo(vinculo);
    await rutinaRepo.actualizarVinculo('v1', 4, 200);
    await rutinaRepo.eliminarVinculo('v1');
    await rutinaRepo.eliminarVinculosDeEjercicio('e1');

    expect(llamada(db.getAllAsync).params).toEqual(['r1']);
    expect(llamada(db.runAsync).sql).toContain('INSERT INTO rutina_ejercicio');
    expect(llamada(db.runAsync).params).toHaveLength(9);
    expect(llamada(db.runAsync, 1).params).toEqual([4, 200, 'v1']);
    expect(llamada(db.runAsync, 2).params).toEqual(['v1']);
    expect(llamada(db.runAsync, 3).params).toEqual(['e1']);
  });
});

describe('ejercicioRepository', () => {
  it('lista y busca ejercicios por id y nombre', async () => {
    db.getAllAsync.mockResolvedValue([ejercicio]);
    db.getFirstAsync.mockResolvedValue(ejercicio);

    await expect(ejercicioRepo.listarEjercicios()).resolves.toEqual([
      ejercicio,
    ]);
    await expect(ejercicioRepo.buscarEjercicio('e1')).resolves.toEqual(
      ejercicio,
    );
    await expect(
      ejercicioRepo.buscarEjercicioPorNombre('Press banca'),
    ).resolves.toEqual(ejercicio);

    expect(llamada(db.getFirstAsync, 0).params).toEqual(['e1']);
    expect(llamada(db.getFirstAsync, 1).params).toEqual(['Press banca']);
  });

  it('inserta, renombra y elimina ejercicios', async () => {
    await ejercicioRepo.insertarEjercicio(ejercicio);
    await ejercicioRepo.renombrarEjercicio('e1', 'Press inclinado', 200);
    await ejercicioRepo.eliminarEjercicio('e1', 200);

    expect(llamada(db.runAsync).sql).toContain('INSERT INTO ejercicio');
    expect(llamada(db.runAsync, 1).params).toEqual([
      'Press inclinado',
      200,
      'e1',
    ]);
    expect(llamada(db.runAsync, 2).params).toEqual([200, 'e1']);
  });
});

describe('serieHechaRepository', () => {
  it('lista series con y sin filtro de ejercicio', async () => {
    db.getAllAsync.mockResolvedValue([serie]);

    await expect(serieRepo.listarSeries()).resolves.toEqual([serie]);
    await expect(serieRepo.listarSeries('Press banca')).resolves.toEqual([
      serie,
    ]);

    expect(llamada(db.getAllAsync).params).toEqual([]);
    expect(llamada(db.getAllAsync, 1).params).toEqual(['Press banca']);
  });

  it('inserta, actualiza y elimina series', async () => {
    await serieRepo.insertarSerie(serie);
    await serieRepo.actualizarSerie('s1', 'Press', '2026-11-22', 12, 25, 200);
    await serieRepo.eliminarSerie('s1', 200);

    expect(llamada(db.runAsync).sql).toContain('INSERT INTO serie_hecha');
    expect(llamada(db.runAsync).params).toEqual([
      's1',
      's1',
      'Press banca',
      '2026-11-21',
      10,
      20,
      100,
      0,
      1,
    ]);
    expect(llamada(db.runAsync, 1).params).toEqual([
      'Press',
      '2026-11-22',
      12,
      25,
      200,
      's1',
    ]);
    expect(llamada(db.runAsync, 2).params).toEqual([200, 's1']);
  });
});
