import * as SecureStore from 'expo-secure-store';

const CLAVE_TOKEN = 'auth_token';
const CLAVE_REFRESH = 'auth_refresh';
const CLAVE_CURSOR = 'sync_cursor';

export type Usuario = {
  id?: string;
  email?: string;
  nombre?: string;
};

export type Sesion = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: Usuario;
};

export type DatosAuth = {
  token: string;
  refreshToken: string;
  expiraEnSeg?: number;
  expira_en_seg?: number;
  usuario?: Usuario;
};

export function normalizarSesion(datos: DatosAuth): Sesion {
  if (!datos.token || !datos.refreshToken) {
    throw new Error('Respuesta de autenticación inválida');
  }
  return {
    token: datos.token,
    refreshToken: datos.refreshToken,
    expiraEnSeg: datos.expiraEnSeg ?? datos.expira_en_seg ?? 3600,
    usuario: datos.usuario ?? {},
  };
}

export async function guardarSesion(sesion: Sesion): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(CLAVE_TOKEN, sesion.token),
    SecureStore.setItemAsync(CLAVE_REFRESH, sesion.refreshToken),
  ]);
}

export async function leerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_TOKEN);
}

export async function leerRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_REFRESH);
}

export async function limpiarSesion(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(CLAVE_TOKEN),
    SecureStore.deleteItemAsync(CLAVE_REFRESH),
  ]);
}

export async function leerCursor(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_CURSOR);
}

export async function guardarCursor(valor: string): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_CURSOR, valor);
}
