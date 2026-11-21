export const initSql = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rutina (
  id TEXT PRIMARY KEY NOT NULL,
  remote_id TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),
  pending INTEGER NOT NULL DEFAULT 0 CHECK (pending IN (0, 1))
);

CREATE TABLE IF NOT EXISTS ejercicio (
  id TEXT PRIMARY KEY NOT NULL,
  remote_id TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),
  pending INTEGER NOT NULL DEFAULT 0 CHECK (pending IN (0, 1))
);

CREATE TABLE IF NOT EXISTS rutina_ejercicio (
  id TEXT PRIMARY KEY NOT NULL,
  remote_id TEXT NOT NULL UNIQUE,
  rutina_id TEXT NOT NULL REFERENCES rutina (id),
  ejercicio_id TEXT NOT NULL REFERENCES ejercicio (id),
  series INTEGER NOT NULL CHECK (series BETWEEN 1 AND 10),
  orden INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),
  pending INTEGER NOT NULL DEFAULT 0 CHECK (pending IN (0, 1)),
  UNIQUE (rutina_id, ejercicio_id)
);

CREATE TABLE IF NOT EXISTS serie_hecha (
  id TEXT PRIMARY KEY NOT NULL,
  remote_id TEXT NOT NULL UNIQUE,
  ejercicio TEXT NOT NULL,
  fecha TEXT NOT NULL,
  repeticiones INTEGER NOT NULL CHECK (repeticiones BETWEEN 1 AND 100),
  peso_g REAL CHECK (peso_g IS NULL OR peso_g >= 0),
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),
  pending INTEGER NOT NULL DEFAULT 0 CHECK (pending IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_rutina_ejercicio_rutina
  ON rutina_ejercicio (rutina_id);
CREATE INDEX IF NOT EXISTS idx_serie_hecha_ejercicio
  ON serie_hecha (ejercicio);
`;
