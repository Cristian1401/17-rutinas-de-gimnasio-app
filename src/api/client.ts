import { endpoint } from './config';
import { ApiError } from './errores';
import {
  guardarSesion,
  leerRefreshToken,
  leerToken,
  limpiarSesion,
  normalizarSesion,
  type DatosAuth,
} from './sesion';

export type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type Opciones = {
  method?: Metodo;
  body?: unknown;
  headers?: Record<string, string>;
};

function cabeceras(
  token: string | null,
  adicionales: Record<string, string>,
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...adicionales,
  };
}

async function ejecutar(
  ruta: string,
  opciones: Opciones,
  token: string | null,
): Promise<Response> {
  return fetch(endpoint(ruta), {
    method: opciones.method ?? 'GET',
    headers: cabeceras(token, opciones.headers ?? {}),
    body:
      opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
  });
}

async function mensaje(respuesta: Response): Promise<string> {
  try {
    const datos = (await respuesta.json()) as {
      mensaje?: string;
      message?: string;
      error?: string;
    };
    return (
      datos.mensaje ??
      datos.message ??
      datos.error ??
      `Error ${respuesta.status}`
    );
  } catch {
    return `Error ${respuesta.status}`;
  }
}

async function cuerpo<T>(respuesta: Response): Promise<T | null> {
  try {
    return (await respuesta.json()) as T;
  } catch {
    return null;
  }
}

export async function solicitarPublico<T>(
  ruta: string,
  opciones: Opciones = {},
): Promise<T | null> {
  const respuesta = await ejecutar(ruta, opciones, null);
  if (!respuesta.ok) {
    throw new ApiError(await mensaje(respuesta), respuesta.status);
  }
  return cuerpo<T>(respuesta);
}

async function refrescarSesion(): Promise<boolean> {
  const refreshToken = await leerRefreshToken();
  if (!refreshToken) {
    await limpiarSesion();
    return false;
  }
  try {
    const datos = await solicitarPublico<DatosAuth>('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    if (!datos) {
      throw new Error('Respuesta de refresco vacía');
    }
    await guardarSesion(normalizarSesion(datos));
    return true;
  } catch {
    await limpiarSesion();
    return false;
  }
}

export async function solicitar<T>(
  ruta: string,
  opciones: Opciones = {},
  reintentar = true,
): Promise<T | null> {
  const token = await leerToken();
  const respuesta = await ejecutar(ruta, opciones, token);
  if (respuesta.status === 401 && reintentar && (await refrescarSesion())) {
    return solicitar<T>(ruta, opciones, false);
  }
  if (!respuesta.ok) {
    throw new ApiError(await mensaje(respuesta), respuesta.status);
  }
  return cuerpo<T>(respuesta);
}
