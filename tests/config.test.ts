import appConfig from '../app.json';
import packageJson from '../package.json';
import tsConfig from '../tsconfig.json';

describe('bootstrap', () => {
  it('configura Expo Router, TypeScript strict y el script check', () => {
    expect(appConfig.expo.plugins).toContain('expo-router');
    expect(tsConfig.compilerOptions.strict).toBe(true);
    expect(packageJson.scripts.check).toBe(
      'npm run typecheck && npm run lint && npm run format:check && npm run test',
    );
  });
});
