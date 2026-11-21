import type * as ClientModule from '../src/db/client';

function fakeDb() {
  return {
    execAsync: jest.fn().mockResolvedValue(undefined),
  };
}

function loadClient(open: jest.Mock, migrate: jest.Mock): typeof ClientModule {
  let client!: typeof ClientModule;
  jest.isolateModules(() => {
    jest.doMock('expo-sqlite', () => ({ openDatabaseAsync: open }));
    jest.doMock('../src/db/migrate', () => ({ migrate }));
    client = jest.requireActual<typeof ClientModule>('../src/db/client');
  });
  return client;
}

describe('getDatabase', () => {
  it('abre, configura y migra una sola vez', async () => {
    const db = fakeDb();
    const open = jest.fn().mockResolvedValue(db);
    const migrate = jest.fn().mockResolvedValue(undefined);
    const client = loadClient(open, migrate);

    await client.getDatabase();
    await client.getDatabase();

    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('rutinas17.db');
    expect(db.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(migrate).toHaveBeenCalledTimes(1);
  });

  it('permite reintentar después de un fallo', async () => {
    const db = fakeDb();
    const open = jest
      .fn()
      .mockRejectedValueOnce(new Error('sin bd'))
      .mockResolvedValueOnce(db);
    const migrate = jest.fn().mockResolvedValue(undefined);
    const client = loadClient(open, migrate);

    await expect(client.getDatabase()).rejects.toThrow('sin bd');
    await expect(client.getDatabase()).resolves.toBe(db);

    expect(open).toHaveBeenCalledTimes(2);
  });
});
