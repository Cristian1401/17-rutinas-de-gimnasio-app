import { API_URL, endpoint } from '../src/api/config';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        EXPO_PUBLIC_API_URL: 'https://api.ejemplo.com///',
      },
    },
  },
}));

describe('configuración de API', () => {
  it('usa EXPO_PUBLIC_API_URL sin barras finales', () => {
    expect(API_URL).toBe('https://api.ejemplo.com');
  });

  it('compone rutas absolutas y relativas', () => {
    expect(endpoint('/api/auth/login')).toBe(
      'https://api.ejemplo.com/api/auth/login',
    );
    expect(endpoint('api/rutina')).toBe('https://api.ejemplo.com/api/rutina');
  });
});
