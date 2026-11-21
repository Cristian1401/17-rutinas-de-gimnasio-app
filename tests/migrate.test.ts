import type { SQLiteDatabase } from 'expo-sqlite';
import { MIGRATIONS } from '../src/db/migrations';
import { migrate } from '../src/db/migrate';

type FakeDb = {
  execAsync: jest.Mock;
  getAllAsync: jest.Mock;
  runAsync: jest.Mock;
  withTransactionAsync: jest.Mock;
};

function fakeDb(versions: number[] = []): FakeDb {
  return {
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest
      .fn()
      .mockResolvedValue(versions.map((version) => ({ version }))),
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  };
}

function asDb(db: FakeDb): SQLiteDatabase {
  return db as unknown as SQLiteDatabase;
}

describe('migrate', () => {
  it('aplica las migraciones pendientes dentro de una transacción', async () => {
    const db = fakeDb();

    await migrate(asDb(db));

    expect(db.execAsync).toHaveBeenCalledTimes(2);
    expect(db.execAsync).toHaveBeenCalledWith(MIGRATIONS[0]);
    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync).toHaveBeenCalledWith(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
      [1, expect.any(Number)],
    );
  });

  it('omite las migraciones ya aplicadas', async () => {
    const db = fakeDb([1]);

    await migrate(asDb(db));

    expect(db.withTransactionAsync).not.toHaveBeenCalled();
    expect(db.runAsync).not.toHaveBeenCalled();
  });
});
