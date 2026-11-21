import * as client from '../src/api/client';
import * as sesion from '../src/api/sesion';
import * as aplicar from '../src/api/syncAplicar';
import { sincronizarTodo } from '../src/api/sync';
import * as syncRepo from '../src/repositories/syncRepository';
import * as servicios from '../src/services/rutinaService';

jest.mock('../src/api/client', () => ({ solicitar: jest.fn() }));
jest.mock('../src/api/sesion', () => ({
  guardarCursor: jest.fn(),
  leerCursor: jest.fn(),
}));
jest.mock('../src/api/syncAplicar', () => ({
  aplicarRutinas: jest.fn(),
  aplicarSeries: jest.fn(),
  fechaCursor: jest.fn(),
  mayor: jest.fn(),
}));
jest.mock('../src/repositories/syncRepository', () => ({
  listarPendientes: jest.fn(),
  marcarSincronizado: jest.fn(),
  marcarVinculosSincronizados: jest.fn(),
  marcarEjerciciosDeRutinaSincronizados: jest.fn(),
}));
jest.mock('../src/services/rutinaService', () => ({
  obtenerRutina: jest.fn(),
}));

const mockSolicitar = client.solicitar as jest.Mock;
const mockLeerCursor = jest.mocked(sesion.leerCursor);
const mockGuardarCursor = jest.mocked(sesion.guardarCursor);
const mockAplicarRutinas = jest.mocked(aplicar.aplicarRutinas);
const mockAplicarSeries = jest.mocked(aplicar.aplicarSeries);
const mockFechaCursor = jest.mocked(aplicar.fechaCursor);
const mockMayor = jest.mocked(aplicar.mayor);
const mockRepo = jest.mocked(syncRepo);
const mockObtener = jest.mocked(servicios.obtenerRutina);

const rutinaPendiente = {
  id: 'r1',
  remote_id: 'r1',
  nombre: 'Pecho',
  updated_at: 100,
  deleted: 0,
  pending: 1,
};

const seriePendiente = {
  id: 's1',
  remote_id: 's1',
  ejercicio: 'Press',
  fecha: '2026-11-21',
  repeticiones: 10,
  peso_g: 20,
  updated_at: 100,
  deleted: 0,
  pending: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLeerCursor.mockResolvedValue(null);
  mockRepo.listarPendientes.mockResolvedValue([]);
  mockRepo.marcarSincronizado.mockResolvedValue(undefined);
  mockRepo.marcarVinculosSincronizados.mockResolvedValue(undefined);
  mockRepo.marcarEjerciciosDeRutinaSincronizados.mockResolvedValue(undefined);
  mockObtener.mockResolvedValue({
    id: 'r1',
    nombre: 'Pecho',
    ejercicios: [
      {
        id: 'v1',
        ejercicioId: 'e1',
        nombre: 'Press',
        series: 3,
        orden: 1,
      },
    ],
    updatedAt: 100,
    pending: true,
  });
  mockAplicarRutinas.mockResolvedValue(0);
  mockAplicarSeries.mockResolvedValue(0);
  mockFechaCursor.mockImplementation(
    (respuesta, anterior) => respuesta.servidor_ahora ?? anterior,
  );
  mockMayor.mockImplementation((a, b) =>
    Date.parse(a) >= Date.parse(b) ? a : b,
  );
});

describe('sincronizarTodo', () => {
  it('sube pendientes, descarga cambios y guarda el cursor', async () => {
    mockRepo.listarPendientes.mockImplementation(async (tabla) =>
      tabla === 'rutina' ? [rutinaPendiente] : [seriePendiente],
    );
    mockSolicitar.mockImplementation(async (ruta: string) => {
      if (ruta === '/api/rutina?since=1970-01-01T00%3A00%3A00.000Z') {
        return {
          items: [{ id: 'r2' }],
          servidor_ahora: '2026-11-21T01:00:00Z',
        };
      }
      if (ruta === '/api/serie_hecha?since=1970-01-01T00%3A00%3A00.000Z') {
        return {
          items: [{ id: 's2' }],
          servidor_ahora: '2026-11-21T02:00:00Z',
        };
      }
      return null;
    });
    mockAplicarRutinas.mockResolvedValue(1);
    mockAplicarSeries.mockResolvedValue(1);

    await expect(sincronizarTodo()).resolves.toEqual({
      enviadas: 2,
      borrados: 0,
      descargadas: 2,
    });

    expect(mockSolicitar).toHaveBeenCalledWith('/api/rutina/r1', {
      method: 'PUT',
      body: {
        nombre: 'Pecho',
        ejercicios: [{ nombre: 'Press', series: 3 }],
      },
    });
    expect(mockSolicitar).toHaveBeenCalledWith('/api/serie_hecha/s1', {
      method: 'PUT',
      body: {
        ejercicio: 'Press',
        fecha: '2026-11-21',
        repeticiones: 10,
        peso_g: 20,
      },
    });
    expect(mockRepo.marcarSincronizado).toHaveBeenCalledWith(
      'rutina',
      'r1',
      100,
    );
    expect(mockGuardarCursor).toHaveBeenCalledWith('2026-11-21T02:00:00Z');
  });

  it('envía borrados y usa el cursor anterior si la API no devuelve uno', async () => {
    mockLeerCursor.mockResolvedValue('2026-11-20T00:00:00.000Z');
    mockRepo.listarPendientes.mockImplementation(async (tabla) => [
      {
        ...(tabla === 'rutina' ? rutinaPendiente : seriePendiente),
        deleted: 1,
      },
    ]);
    mockSolicitar.mockResolvedValue(null);

    await expect(sincronizarTodo()).resolves.toEqual({
      enviadas: 0,
      borrados: 2,
      descargadas: 0,
    });

    expect(mockSolicitar).toHaveBeenCalledWith('/api/rutina/r1', {
      method: 'DELETE',
    });
    expect(mockSolicitar).toHaveBeenCalledWith('/api/serie_hecha/s1', {
      method: 'DELETE',
    });
    expect(mockGuardarCursor).toHaveBeenCalledWith('2026-11-20T00:00:00.000Z');
  });

  it('propaga errores de la API', async () => {
    mockSolicitar.mockRejectedValue(new Error('Sin conexión'));
    await expect(sincronizarTodo()).rejects.toThrow('Sin conexión');
  });
});
