import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { migrate } from './migrate';

const DATABASE_NAME = 'rutinas17.db';
let connection: Promise<SQLiteDatabase> | undefined;

async function open(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

export function getDatabase(): Promise<SQLiteDatabase> {
  if (!connection) {
    connection = open().catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}
