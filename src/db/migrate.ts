import type { SQLiteDatabase } from 'expo-sqlite';
import { MIGRATIONS } from './migrations';

type VersionRow = { version: number };

const CREATE_MIGRATIONS =
  'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)';

async function ensureMigrationTable(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_MIGRATIONS);
}

async function appliedVersions(db: SQLiteDatabase): Promise<number[]> {
  const rows = await db.getAllAsync<VersionRow>(
    'SELECT version FROM schema_migrations',
  );
  return rows.map((row) => row.version);
}

async function applyMigration(
  db: SQLiteDatabase,
  version: number,
  sql: string,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(sql);
    await db.runAsync(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
      [version, Date.now()],
    );
  });
}

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await ensureMigrationTable(db);
  const applied = await appliedVersions(db);
  for (const [index, sql] of MIGRATIONS.entries()) {
    const version = index + 1;
    if (!applied.includes(version)) {
      await applyMigration(db, version, sql);
    }
  }
}
