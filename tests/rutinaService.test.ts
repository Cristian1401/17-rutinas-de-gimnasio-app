import * as Crypto from 'expo-crypto';
import * as ejercicioRepo from '../src/repositories/ejercicioRepository';
import * as rutinaRepo from '../src/repositories/rutinaRepository';
import * as ejercicioService from '../src/services/ejercicioService';
import * as rutinaService from '../src/services/rutinaService';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('../src/repositories/rutinaRepository', () => ({
  listarRutinas: jest.fn(),
  buscarRutina: jest.fn(),
  insertarRutina: jest.fn(),
  renombrarRutina: jest.fn(),
  eliminarRutina: jest.fn(),
  listarEjerciciosDeRutina: jest.fn(),
  insertarVinculo: jest.fn(),
  actualizarVinculo: jest.fn(),
  eliminarVinculo: jest.fn(),
  eliminarVinculosDeEjercicio: jest.fn(),
}));
jest.mock('../src/repositories/ejercicioRepository', () => ({
  listarEjercicios: jest.fn(),
  buscarEjercicio: jest.fn(),
  buscarEjercicioPorNombre: jest.fn(),
  insertarEjercicio: jest.fn(),
  renombrarEjercicio: jest.fn(),
  eliminarEjercicio: jest.fn(),
}));

const mockCrypto = jest.mocked(Crypto);
const mockRutinaRepo = jest.mocked(rutinaRepo);
const mockEjercicioRepo = jest.mocked(ejercicioRepo);

const rutinaRow = {
  id: 'r1',
  remote_id: 'r1',
  nombre: 'Pecho',
  updated_at: 100,
  deleted: 0,
  pending: 1,
};

const detalleRow = {
  id: 'v1',
  remote_id: 'v1',
  rutina_id: 'r1',
  ejercicio_id: 'e1',
  ejercicio_nombre: 'Press banca',
  series: 3,
  orden: 1,
  updated_at: 100,
  deleted: 0,
  pending: 1,
};

const ejercicioRow = {
  id: 'e1',
  remote_id: 'e1',
  nombre: 'Press banca',
  updated_at: 100,
  deleted: 0,
  pending: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(1000);
  mockCrypto.randomUUID.mockReturnValue('id-nuevo');
  mockRutinaRepo.listarRutinas.mockResolvedValue([]);
  mockRutinaRepo.buscarRutina.mockResolvedValue(rutinaRow);
  mockRutinaRepo.listarEjerciciosDeRutina.mockResolvedValue([]);
  mockRutinaRepo.insertarRutina.mockResolvedValue(undefined);
  mockRutinaRepo.insertarVinculo.mockResolvedValue(undefined);
  mockEjercicioRepo.listarEjercicios.mockResolvedValue([]);
  mockEjercicioRepo.buscarEjercicio.mockResolvedValue(ejercicioRow);
  mockEjercicioRepo.insertarEjercicio.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('rutinaService', () => {
  it('lista rutinas con sus ejercicios', async () => {
    mockRutinaRepo.listarRutinas.mockResolvedValue([rutinaRow]);
    mockRutinaRepo.listarEjerciciosDeRutina.mockResolvedValue([detalleRow]);

    await expect(rutinaService.listarRutinas()).resolves.toEqual([
      {
        id: 'r1',
        nombre: 'Pecho',
        ejercicios: [
          {
            id: 'v1',
            ejercicioId: 'e1',
            nombre: 'Press banca',
            series: 3,
            orden: 1,
          },
        ],
        updatedAt: 100,
        pending: true,
      },
    ]);
  });

  it('avisa cuando la rutina no existe', async () => {
    mockRutinaRepo.buscarRutina.mockResolvedValue(null);
    await expect(rutinaService.obtenerRutina('r1')).rejects.toThrow(
      'Rutina no encontrada',
    );
  });

  it('crea una rutina con su ejercicio inicial', async () => {
    mockRutinaRepo.listarEjerciciosDeRutina
      .mockResolvedValueOnce([])
      .mockResolvedValue([detalleRow]);

    const resultado = await rutinaService.crearRutina({
      nombre: '  Pecho  ',
      ejercicios: [{ nombre: 'Press banca', series: 3 }],
    });

    expect(resultado.nombre).toBe('Pecho');
    expect(mockRutinaRepo.insertarRutina).toHaveBeenCalledWith({
      id: 'id-nuevo',
      remote_id: 'id-nuevo',
      nombre: 'Pecho',
      updated_at: 1000,
      deleted: 0,
      pending: 1,
    });
    expect(mockEjercicioRepo.insertarEjercicio).toHaveBeenCalledTimes(1);
    expect(mockRutinaRepo.insertarVinculo).toHaveBeenCalledWith(
      expect.objectContaining({ orden: 1, series: 3 }),
    );
  });

  it('rechaza una rutina sin ejercicios', async () => {
    await expect(
      rutinaService.crearRutina({ nombre: 'Pecho', ejercicios: [] }),
    ).rejects.toThrow('Añade al menos un ejercicio');
    expect(mockRutinaRepo.insertarRutina).not.toHaveBeenCalled();
  });

  it('renombra y elimina rutinas existentes', async () => {
    await rutinaService.renombrarRutina('r1', ' Pierna ');
    await rutinaService.eliminarRutina('r1');

    expect(mockRutinaRepo.renombrarRutina).toHaveBeenCalledWith(
      'r1',
      'Pierna',
      1000,
    );
    expect(mockRutinaRepo.eliminarRutina).toHaveBeenCalledWith('r1', 1000);
  });

  it('no renombra una rutina inexistente', async () => {
    mockRutinaRepo.buscarRutina.mockResolvedValue(null);
    await expect(rutinaService.renombrarRutina('r1', 'Pierna')).rejects.toThrow(
      'Rutina no encontrada',
    );
  });

  it('añade, actualiza y quita ejercicios de la rutina', async () => {
    mockRutinaRepo.listarEjerciciosDeRutina.mockResolvedValue([detalleRow]);

    await rutinaService.agregarEjercicio('r1', 'e1', 3);
    await rutinaService.cambiarSeries('v1', 4);
    await rutinaService.quitarEjercicio('v1');

    expect(mockRutinaRepo.insertarVinculo).toHaveBeenCalledWith(
      expect.objectContaining({ orden: 2, series: 3 }),
    );
    expect(mockRutinaRepo.actualizarVinculo).toHaveBeenCalledWith(
      'v1',
      4,
      1000,
    );
    expect(mockRutinaRepo.eliminarVinculo).toHaveBeenCalledWith('v1');
  });

  it('valida las series al añadir un ejercicio', async () => {
    await expect(rutinaService.agregarEjercicio('r1', 'e1', 0)).rejects.toThrow(
      'Las series deben estar entre 1 y 10',
    );
  });
});

describe('ejercicioService', () => {
  it('lista ejercicios con su estado de sincronía', async () => {
    mockEjercicioRepo.listarEjercicios.mockResolvedValue([ejercicioRow]);

    await expect(ejercicioService.listarEjercicios()).resolves.toEqual([
      {
        id: 'e1',
        nombre: 'Press banca',
        updatedAt: 100,
        pending: false,
      },
    ]);
  });

  it('crea un ejercicio', async () => {
    await expect(
      ejercicioService.crearEjercicio(' Sentadilla '),
    ).resolves.toEqual({
      id: 'id-nuevo',
      nombre: 'Sentadilla',
      updatedAt: 1000,
      pending: true,
    });
    expect(mockEjercicioRepo.insertarEjercicio).toHaveBeenCalledWith(
      expect.objectContaining({ pending: 1, updated_at: 1000 }),
    );
  });

  it('renombra y elimina ejercicios', async () => {
    await ejercicioService.renombrarEjercicio('e1', ' Press ');
    await ejercicioService.eliminarEjercicio('e1');

    expect(mockEjercicioRepo.renombrarEjercicio).toHaveBeenCalledWith(
      'e1',
      'Press',
      1000,
    );
    expect(mockRutinaRepo.eliminarVinculosDeEjercicio).toHaveBeenCalledWith(
      'e1',
    );
    expect(mockEjercicioRepo.eliminarEjercicio).toHaveBeenCalledWith(
      'e1',
      1000,
    );
  });

  it('avisa cuando el ejercicio no existe', async () => {
    mockEjercicioRepo.buscarEjercicio.mockResolvedValue(null);
    await expect(
      ejercicioService.renombrarEjercicio('e1', 'Press'),
    ).rejects.toThrow('Ejercicio no encontrado');
    await expect(ejercicioService.eliminarEjercicio('e1')).rejects.toThrow(
      'Ejercicio no encontrado',
    );
  });
});
