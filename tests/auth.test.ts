import {
  cerrarSesion,
  haySesion,
  iniciarSesion,
  registrarse,
} from '../src/api/auth';
import { solicitarPublico } from '../src/api/client';
import * as sesionApi from '../src/api/sesion';
import type { Sesion } from '../src/api/sesion';

jest.mock('../src/api/client', () => ({
  solicitarPublico: jest.fn(),
}));

jest.mock('../src/api/sesion', () => ({
  guardarSesion: jest.fn(),
  leerToken: jest.fn(),
  limpiarSesion: jest.fn(),
  normalizarSesion: jest.fn(),
}));

const mockSolicitar = jest.mocked(solicitarPublico);
const mockSesion = jest.mocked(sesionApi);

const sesion: Sesion = {
  token: 'token',
  refreshToken: 'refresh',
  expiraEnSeg: 900,
  usuario: {},
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSesion.normalizarSesion.mockReturnValue(sesion);
  mockSolicitar.mockResolvedValue({
    token: 'token',
    refreshToken: 'refresh',
    expiraEnSeg: 900,
  });
});

describe('autenticación', () => {
  it('inicia sesión y guarda el token', async () => {
    await expect(iniciarSesion('a@b.com', 'secreto')).resolves.toEqual(sesion);
    expect(mockSolicitar).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: { email: 'a@b.com', password: 'secreto' },
    });
    expect(mockSesion.guardarSesion).toHaveBeenCalledWith(sesion);
  });

  it('registra una cuenta', async () => {
    await registrarse('a@b.com', 'secreto');
    expect(mockSolicitar).toHaveBeenCalledWith('/api/auth/registro', {
      method: 'POST',
      body: { email: 'a@b.com', password: 'secreto' },
    });
  });

  it('rechaza respuestas vacías', async () => {
    mockSolicitar.mockResolvedValue(null);
    await expect(iniciarSesion('a@b.com', 'secreto')).rejects.toThrow(
      'Respuesta de autenticación vacía',
    );
  });

  it('cierra sesión y consulta si hay sesión', async () => {
    await cerrarSesion();
    expect(mockSesion.limpiarSesion).toHaveBeenCalled();

    mockSesion.leerToken.mockResolvedValueOnce('token');
    mockSesion.leerToken.mockResolvedValueOnce(null);
    await expect(haySesion()).resolves.toBe(true);
    await expect(haySesion()).resolves.toBe(false);
  });
});
