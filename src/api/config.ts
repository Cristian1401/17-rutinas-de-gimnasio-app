import Constants from 'expo-constants';

type Extra = { EXPO_PUBLIC_API_URL?: string };

const extra = Constants.expoConfig?.extra as Extra | undefined;

const base =
  process.env.EXPO_PUBLIC_API_URL ??
  extra?.EXPO_PUBLIC_API_URL ??
  'https://17-rutinas-de-gimnasio-api.vercel.app';

export const API_URL = base.replace(/\/+$/, '');

export function endpoint(ruta: string): string {
  return `${API_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
}
