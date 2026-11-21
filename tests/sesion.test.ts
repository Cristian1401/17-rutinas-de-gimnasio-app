import * as SecureStore from 'expo-secure-store';
import {
  guardarCursor,
  guardarSesion,
  leerCursor,
  leerRefreshToken,
  leerToken,
  limpiarSesion,
  normalizarSesion,
  type Sesion,
} from '../src/api/sesion';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockStore = jest.mocked(SecureStore);

const sesion: Sesion = {
  token: 'token',
  refreshToken: 'refresh',
  expiraEnSeg: 900,
  usuario: { email: 'a@b.com' },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('sesión', () => {
  it('normaliza la respuesta de autenticación', () => {
    expect(
      normalizarSesion({
        token: 'token',
        refreshToken: 'refresh',
        expira_en_seg: 900,
        usuario: { email: 'a@b.com' },
      }),
    ).toEqual(sesion);
    expect(
      normalizarSesion({ token: 'token', refreshToken: 'refresh' }),
    ).toMatchObject({ expiraEnSeg: 3600, usuario: {} });
  });

  it('rechaza respuestas sin token', () => {
    expect(() =>
      normalizarSesion({ token: '', refreshToken: 'refresh' }),
    ).toThrow('Respuesta de autenticación inválida');
  });

  it('guarda y limpia el token y el refresh', async () => {
    await guardarSesion(sesion);
    expect(mockStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'token');
    expect(mockStore.setItemAsync).toHaveBeenCalledWith(
      'auth_refresh',
      'refresh',
    );

    await limpiarSesion();
    expect(mockStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    expect(mockStore.deleteItemAsync).toHaveBeenCalledWith('auth_refresh');
  });

  it('lee token, refresh y cursor', async () => {
    mockStore.getItemAsync
      .mockResolvedValueOnce('token')
      .mockResolvedValueOnce('refresh')
      .mockResolvedValueOnce('2026-11-21T00:00:00.000Z');

    await expect(leerToken()).resolves.toBe('token');
    await expect(leerRefreshToken()).resolves.toBe('refresh');
    await expect(leerCursor()).resolves.toBe('2026-11-21T00:00:00.000Z');
  });

  it('guarda el cursor de sincronización', async () => {
    await guardarCursor('2026-11-21T00:00:00.000Z');
    expect(mockStore.setItemAsync).toHaveBeenCalledWith(
      'sync_cursor',
      '2026-11-21T00:00:00.000Z',
    );
  });
});
