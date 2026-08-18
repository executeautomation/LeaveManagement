// filepath: src/lib/db.ts
//
// SQLite singleton + schema + seed.
//
// Why this exists: real `expo-sqlite` has a broken web build that references a
// .wasm file Metro can't bundle. `metro.config.js` redirects
// `require('expo-sqlite')` to `./expo-sqlite.web-shim.ts` on web — so we can
// just use the package's normal typed import here and let Metro swap it out
// per-platform. Native uses the real binding; web uses the in-memory shim.

import { openDatabaseSync } from 'expo-sqlite';
import { Platform } from 'react-native';
import { LEAVE_TYPES } from './leave-types';
import { DEFAULT_ANNUAL_TOTAL, DEFAULT_BALANCES } from './seed';

const DB_NAME = 'leave-management.db';

// Sync API shape that both the native binding and the web shim satisfy.
export interface DbHandle {
  execSync(sql: string): void;
  runSync(
    sql: string,
    ...params: unknown[]
  ): { lastInsertRowId: number; changes: number };
  getAllSync<T = unknown>(sql: string, ...params: unknown[]): T[];
  getFirstSync<T = unknown>(sql: string, ...params: unknown[]): T | null;
}

let _db: DbHandle | null = null;

export function getDb(): DbHandle {
  if (_db) return _db;

  // On web, `metro.config.js` redirects this import to ./expo-sqlite.web-shim.ts.
  // On iOS/Android, this resolves to the real native binding.
  const native = openDatabaseSync(DB_NAME) as unknown as DbHandle;

  // The web shim is read-only; nothing to seed/initialize.
  if (Platform.OS === 'web') {
    _db = native;
    return _db;
  }

  initSchema(native);
  ensureSeed(native);
  _db = native;
  return _db;
}

/**
 * The full schema. Bump SCHEMA_VERSION when adding a new table/column — the
 * `user_version` PRAGMA is used to run one-shot migrations.
 */
const SCHEMA_VERSION = 2;
void SCHEMA_VERSION; // referenced by future migrations; keep exported value

function initSchema(db: DbHandle) {
  db.execSync(`PRAGMA journal_mode = WAL;`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS leave_types (
      key TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      short TEXT NOT NULL,
      color TEXT NOT NULL,
      paid INTEGER NOT NULL,
      requires_reason INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS leave_balances (
      year INTEGER NOT NULL,
      type_key TEXT NOT NULL,
      allocated INTEGER NOT NULL,
      PRIMARY KEY (year, type_key),
      FOREIGN KEY (type_key) REFERENCES leave_types(key) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY NOT NULL,
      type_key TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      days INTEGER NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (type_key) REFERENCES leave_types(key) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_leave_requests_start
      ON leave_requests(start_date);
    CREATE INDEX IF NOT EXISTS idx_leave_requests_status
      ON leave_requests(status);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  // Migrations. SQLite's `PRAGMA user_version` is a 32-bit integer the
  // driver exposes for exactly this purpose; bump SCHEMA_VERSION above when
  // you add a new statement here.
  const current = db.getFirstSync<{ user_version: number }>(
    'PRAGMA user_version',
  )?.user_version ?? 0;

  if (current < 2) {
    // v2: introduce the `settings` table for user-editable preferences
    // (annual-leave quota, etc.). The CREATE TABLE above is idempotent, so
    // nothing else needs to run — but we still bump the version so we can
    // track that the schema is current.
    db.execSync('PRAGMA user_version = 2;');
  }
}

function ensureSeed(db: DbHandle) {
  // Seed leave types
  const typesCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM leave_types',
  );
  if (!typesCount || typesCount.count === 0) {
    let order = 0;
    for (const t of LEAVE_TYPES) {
      db.runSync(
        `INSERT INTO leave_types (key, label, short, color, paid, requires_reason, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        t.key,
        t.label,
        t.short,
        t.color,
        t.paid ? 1 : 0,
        t.requiresReason ? 1 : 0,
        order++,
      );
    }
  }

  const year = new Date().getFullYear();
  const balanceCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM leave_balances WHERE year = ?',
    year,
  );
  if (!balanceCount || balanceCount.count === 0) {
    for (const b of DEFAULT_BALANCES) {
      db.runSync(
        'INSERT INTO leave_balances (year, type_key, allocated) VALUES (?, ?, ?)',
        year,
        b.typeKey,
        b.allocated,
      );
    }
  }

  // Seed the editable annual-leave total so the dashboard has a meaningful
  // "Annual days left" value even before the user has applied for anything.
  const annualAllocated = db.getFirstSync<{ allocated: number }>(
    'SELECT allocated FROM leave_balances WHERE year = ? AND type_key = ?',
    year,
    'annual',
  )?.allocated;

  // The seeded balance for `annual` becomes the initial `annualTotal`.
  db.runSync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('annualTotal', ?)`,
    String(annualAllocated ?? DEFAULT_ANNUAL_TOTAL),
  );
}
