import * as Crypto from 'expo-crypto';
import * as ejercicios from '../src/repositories/ejercicioRepository';
import * as vinculos from '../src/repositories/rutinaRepository';
import * as syncRepo from '../src/repositories/syncRepository';
import {
  aMilis,
  actualizadoDe,
  aplicarRutinas,
  aplicarSeries,
  debeAplicar,
  estaBorrado,
  fechaCursor,
  idDe,
  mayor,
} from '../src/api/syncAplicar';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('../src/repositories/syncRepository', () => ({
  buscarFila: jest.fn(),
  upsertRutina: jest.fn(),
  upsertSerie: jest.fn(),
  eliminarVinculosDeRutina: jest.fn(),
  marcarEjercicioSincronizado: jest.fn(),
}));
jest.mock('../src/repositories/ejercicioRepository', () => ({
  buscarEjercicioPorNombre: jest.fn(),
  insertarEjercicio: jest.fn(),
}));
jest.mock('../src/repositories/rutinaRepository', () => ({
  insertarVinculo: jest.fn(),
}));

const mockCrypto = jest.mocked(Crypto);
const mockRepo = jest.mocked(syncRepo);
const mockEjercicios = jest.mocked(ejercicios);
const mockVinculos = jest.mocked(vinculos);

const local = {
  id: 'r1',
  remote_id: 'r1',
  nombre: 'Local',
  updated_at: 500,
  deleted: 0,
  pending: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCrypto.randomUUID.mockReturnValue('generado');
  mockRepo.buscarFila.mockResolvedValue(null);
  mockRepo.upsertRutina.mockResolvedValue(undefined);
  mockRepo.upsertSerie.mockResolvedValue(undefined);
  mockRepo.eliminarVinculosDeRutina.mockResolvedValue(undefined);
  mockRepo.marcarEjercicioSincronizado.mockResolvedValue(undefined);
  mockEjercicios.buscarEjercicioPorNombre.mockResolvedValue(null);
  mockEjercicios.insertarEjercicio.mockResolvedValue(undefined);
  mockVinculos.insertarVinculo.mockResolvedValue(undefined);
});

describe('utilidades de sincronización', () => {
  it('lee identificadores y fechas remotas', () => {
    expect(idDe({ id: 'a' })).toBe('a');
    expect(idDe({ remote_id: 'b' })).toBe('b');
    expect(idDe({})).toBe('');
    expect(aMilis(100)).toBe(100);
    expect(aMilis('2026-01-01T00:00:00.000Z')).toBe(Date.parse('2026-01-01'));
    expect(aMilis(undefined)).toBe(0);
    expect(actualizadoDe({ updatedAt: 50 })).toBe(50);
  });

  it('detecta borrados y aplica last-write-wins', () => {
    expect(estaBorrado({ deleted: true })).toBe(true);
    expect(estaBorrado({ deleted_at: '2026-01-01' })).toBe(true);
    expect(estaBorrado({})).toBe(false);
    expect(debeAplicar(null, 100)).toBe(true);
    expect(debeAplicar(local, 400)).toBe(false);
    expect(debeAplicar({ ...local, pending: 1 }, 400)).toBe(false);
    expect(debeAplicar(local, 500)).toBe(true);
    expect(debeAplicar(local, 600)).toBe(true);
  });

  it('elige el cursor más reciente', () => {
    expect(fechaCursor({ items: [] }, 'anterior')).toBe('anterior');
    expect(
      fechaCursor(
        { items: [], servidorAhora: '2026-01-02T00:00:00.000Z' },
        'a',
      ),
    ).toBe('2026-01-02T00:00:00.000Z');
    expect(mayor('2026-01-01', '2026-01-02')).toBe('2026-01-02');
  });
});

describe('aplicarRutinas', () => {
  it('inserta una rutina remota con sus ejercicios', async () => {
    const cantidad = await aplicarRutinas([
      {
        id: 'r1',
        nombre: ' Remota ',
        updated_at: 600,
        ejercicios: [{ nombre: 'Press', series: 3 }],
      },
    ]);

    expect(cantidad).toBe(1);
    expect(mockRepo.upsertRutina).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Remota', pending: 0 }),
    );
    expect(mockVinculos.insertarVinculo).toHaveBeenCalledWith(
      expect.objectContaining({ series: 3, orden: 1, pending: 0 }),
    );
  });

  it('reutiliza un ejercicio local existente', async () => {
    mockEjercicios.buscarEjercicioPorNombre.mockResolvedValue({
      id: 'e1',
      remote_id: 'e1',
      nombre: 'Press',
      updated_at: 10,
      deleted: 0,
      pending: 0,
    });

    await aplicarRutinas([
      {
        id: 'r1',
        nombre: 'Remota',
        updatedAt: 600,
        ejercicios: [{ nombre: 'Press', series: 2 }],
      },
    ]);

    expect(mockEjercicios.insertarEjercicio).not.toHaveBeenCalled();
    expect(mockRepo.marcarEjercicioSincronizado).toHaveBeenCalledWith(
      'e1',
      600,
    );
  });

  it('marca borrados y omite cambios locales más recientes', async () => {
    mockRepo.buscarFila.mockImplementation(async (_tabla, id) =>
      id === 'r2' ? { ...local, id: 'r2' } : null,
    );
    const cantidad = await aplicarRutinas([
      { id: 'r1', nombre: 'Remota', deleted_at: '2026-01-01', updated_at: 400 },
      { id: 'r2', nombre: 'Otra', updated_at: 100 },
    ]);

    expect(cantidad).toBe(1);
    expect(mockRepo.upsertRutina).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r1', deleted: 1 }),
    );
    expect(mockRepo.upsertRutina).toHaveBeenCalledTimes(1);
  });

  it('ignora items sin identificador', async () => {
    await expect(aplicarRutinas([{ nombre: 'Sin id' }])).resolves.toBe(0);
  });
});

describe('aplicarSeries', () => {
  it('aplica una serie remota válida', async () => {
    const cantidad = await aplicarSeries([
      {
        id: 's1',
        ejercicio: 'Press',
        fecha: '2026-11-21',
        repeticiones: 10,
        peso_g: 20,
        updated_at: 600,
      },
    ]);

    expect(cantidad).toBe(1);
    expect(mockRepo.upsertSerie).toHaveBeenCalledWith(
      expect.objectContaining({ peso_g: 20, pending: 0 }),
    );
  });

  it('aplica borrados remotos y omite locales recientes', async () => {
    mockRepo.buscarFila.mockImplementation(async (_tabla, id) => ({
      id,
      remote_id: id,
      ejercicio: 'Press',
      fecha: '2026-11-20',
      repeticiones: 8,
      peso_g: null,
      updated_at: id === 's1' ? 400 : 500,
      deleted: 0,
      pending: 0,
    }));

    const cantidad = await aplicarSeries([
      {
        id: 's1',
        deleted: true,
        updated_at: 400,
        ejercicio: '',
        fecha: '',
        repeticiones: 1,
        peso_g: null,
      },
      {
        id: 's2',
        deleted: true,
        updated_at: 100,
        ejercicio: '',
        fecha: '',
        repeticiones: 1,
        peso_g: null,
      },
    ]);

    expect(cantidad).toBe(1);
    expect(mockRepo.upsertSerie).toHaveBeenCalledTimes(1);
  });

  it('ignora items sin identificador', async () => {
    await expect(
      aplicarSeries([
        {
          ejercicio: 'Press',
          fecha: '2026-11-21',
          repeticiones: 10,
          peso_g: null,
        },
      ]),
    ).resolves.toBe(0);
  });
});
