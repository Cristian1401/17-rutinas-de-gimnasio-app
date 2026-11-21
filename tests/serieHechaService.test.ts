import * as Crypto from 'expo-crypto';
import * as serieRepo from '../src/repositories/serieHechaRepository';
import * as serieService from '../src/services/serieHechaService';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('../src/repositories/serieHechaRepository', () => ({
  listarSeries: jest.fn(),
  insertarSerie: jest.fn(),
  actualizarSerie: jest.fn(),
  eliminarSerie: jest.fn(),
}));

const mockCrypto = jest.mocked(Crypto);
const mockSerieRepo = jest.mocked(serieRepo);

const serieRow = {
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

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(1000);
  mockCrypto.randomUUID.mockReturnValue('id-nuevo');
  mockSerieRepo.listarSeries.mockResolvedValue([]);
  mockSerieRepo.insertarSerie.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('serieHechaService', () => {
  it('lista series con y sin peso', async () => {
    mockSerieRepo.listarSeries.mockResolvedValue([
      serieRow,
      { ...serieRow, id: 's2', peso_g: null },
    ]);

    const resultado = await serieService.listarSeries();

    expect(resultado[0].pesoG).toBe(20);
    expect(resultado[1].pesoG).toBeUndefined();
    expect(mockSerieRepo.listarSeries).toHaveBeenCalledWith(undefined);
  });

  it('crea una serie válida', async () => {
    await expect(
      serieService.crearSerie({
        ejercicio: ' Press banca ',
        fecha: '2026-11-21',
        repeticiones: 10,
        pesoG: 20,
      }),
    ).resolves.toEqual({
      id: 'id-nuevo',
      ejercicio: 'Press banca',
      fecha: '2026-11-21',
      repeticiones: 10,
      pesoG: 20,
      updatedAt: 1000,
      pending: true,
    });
    expect(mockSerieRepo.insertarSerie).toHaveBeenCalledWith(
      expect.objectContaining({ remote_id: 'id-nuevo', peso_g: 20 }),
    );
  });

  it('crea una serie sin peso', async () => {
    const serie = await serieService.crearSerie({
      ejercicio: 'Sentadilla',
      fecha: '2026-11-21',
      repeticiones: 8,
    });

    expect(serie.pesoG).toBeUndefined();
    expect(mockSerieRepo.insertarSerie).toHaveBeenCalledWith(
      expect.objectContaining({ peso_g: null }),
    );
  });

  it('actualiza y elimina series', async () => {
    const input = {
      ejercicio: 'Press',
      fecha: '2026-11-22',
      repeticiones: 12,
    };

    await serieService.actualizarSerie('s1', input);
    await serieService.eliminarSerie('s1');

    expect(mockSerieRepo.actualizarSerie).toHaveBeenCalledWith(
      's1',
      'Press',
      '2026-11-22',
      12,
      null,
      1000,
    );
    expect(mockSerieRepo.eliminarSerie).toHaveBeenCalledWith('s1', 1000);
  });

  it('rechaza repeticiones fuera de rango', async () => {
    await expect(
      serieService.crearSerie({
        ejercicio: 'Press',
        fecha: '2026-11-21',
        repeticiones: 101,
      }),
    ).rejects.toThrow('Las repeticiones deben estar entre 1 y 100');
  });
});
