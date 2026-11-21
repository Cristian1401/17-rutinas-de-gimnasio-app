import { solicitarPublico } from './client';
import {
  guardarSesion,
  leerToken,
  limpiarSesion,
  normalizarSesion,
  type DatosAuth,
  type Sesion,
} from './sesion';

type Credenciales = { email: string; password: string };

async function autenticar(
  ruta: string,
  credenciales: Credenciales,
): Promise<Sesion> {
  const datos = await solicitarPublico<DatosAuth>(ruta, {
    method: 'POST',
    body: credenciales,
  });
  if (!datos) {
    throw new Error('Respuesta de autenticación vacía');
  }
  const sesion = normalizarSesion(datos);
  await guardarSesion(sesion);
  return sesion;
}

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<Sesion> {
  return autenticar('/api/auth/login', { email, password });
}

export async function registrarse(
  email: string,
  password: string,
): Promise<Sesion> {
  return autenticar('/api/auth/registro', { email, password });
}

export async function cerrarSesion(): Promise<void> {
  await limpiarSesion();
}

export async function haySesion(): Promise<boolean> {
  return (await leerToken()) !== null;
}
