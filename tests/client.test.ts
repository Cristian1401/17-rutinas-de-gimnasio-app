import { ApiError } from '../src/api/errores';
import { solicitar, solicitarPublico } from '../src/api/client';
import * as sesion from '../src/api/sesion';
import type { Sesion } from '../src/api/sesion';

jest.mock('../src/api/config', () => ({
  endpoint: (ruta: string) => `https://api.test${ruta}`,
}));

jest.mock('../src/api/sesion', () => ({
  guardarSesion: jest.fn(),
  leerRefreshToken: jest.fn(),
  leerToken: jest.fn(),
  limpiarSesion: jest.fn(),
  normalizarSesion: jest.fn(),
}));

type GlobalFetch = { fetch: typeof fetch };

const fetchMock = jest.fn();
const mockSesion = jest.mocked(sesion);

const nuevaSesion: Sesion = {
  token: 'nuevo',
  refreshToken: 'refresh-nuevo',
  expiraEnSeg: 900,
  usuario: {},
};

function respuesta(status: number, datos?: unknown, falla = false): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: jest
      .fn()
      .mockImplementation(() =>
        falla ? Promise.reject(new Error('sin json')) : Promise.resolve(datos),
      ),
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  (globalThis as unknown as GlobalFetch).fetch =
    fetchMock as unknown as typeof fetch;
  mockSesion.leerToken.mockResolvedValue('token');
  mockSesion.leerRefreshToken.mockResolvedValue(null);
  mockSesion.normalizarSesion.mockReturnValue(nuevaSesion);
});

describe('cliente HTTP', () => {
  it('envía el token Bearer y devuelve el cuerpo', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { ok: true }));

    await expect(solicitar('/api/rutina')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/rutina', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      body: undefined,
    });
  });

  it('refresca una vez y reintenta con el token nuevo', async () => {
    mockSesion.leerToken
      .mockResolvedValueOnce('viejo')
      .mockResolvedValueOnce('nuevo');
    mockSesion.leerRefreshToken.mockResolvedValue('refresh');
    fetchMock
      .mockResolvedValueOnce(respuesta(401))
      .mockResolvedValueOnce(
        respuesta(200, {
          token: 'nuevo',
          refreshToken: 'refresh-nuevo',
        }),
      )
      .mockResolvedValueOnce(respuesta(200, { sincronizado: true }));

    await expect(solicitar('/api/rutina')).resolves.toEqual({
      sincronizado: true,
    });
    expect(mockSesion.guardarSesion).toHaveBeenCalledWith(nuevaSesion);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      headers: { Authorization: 'Bearer nuevo' },
    });
  });

  it('limpia la sesión si no hay refreshToken', async () => {
    fetchMock.mockResolvedValue(respuesta(401, { message: 'No autorizado' }));

    await expect(solicitar('/api/rutina')).rejects.toBeInstanceOf(ApiError);
    expect(mockSesion.limpiarSesion).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('limpia la sesión si el refresco falla', async () => {
    mockSesion.leerRefreshToken.mockResolvedValue('refresh');
    fetchMock
      .mockResolvedValueOnce(respuesta(401))
      .mockResolvedValueOnce(respuesta(500, { error: 'Falló' }));

    await expect(solicitar('/api/rutina')).rejects.toMatchObject({
      status: 401,
    });
    expect(mockSesion.limpiarSesion).toHaveBeenCalled();
  });

  it('propaga errores con mensaje de la API', async () => {
    fetchMock.mockResolvedValue(respuesta(422, { message: 'Datos inválidos' }));

    await expect(solicitarPublico('/api/auth/login')).rejects.toMatchObject({
      message: 'Datos inválidos',
      status: 422,
    });
  });

  it('devuelve null si la respuesta no tiene JSON', async () => {
    fetchMock.mockResolvedValue(respuesta(204, undefined, true));

    await expect(solicitarPublico('/api/auth/refresh')).resolves.toBeNull();
  });

  it('serializa el cuerpo en solicitudes públicas', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { ok: true }));

    await solicitarPublico('/api/auth/login', {
      method: 'POST',
      body: { email: 'a@b.com' },
    });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: '{"email":"a@b.com"}',
    });
  });
});
