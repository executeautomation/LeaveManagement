// filepath: src/lib/expo-sqlite.web-shim.ts
//
// Pure-JS replacement for the `expo-sqlite` package on web.
//
// Why this exists: `expo-sqlite`'s web build references a `.wasm` file
// (./wa-sqlite/wa-sqlite.wasm) that the default Metro web resolver can't
// bundle. `metro.config.js` redirects `require('expo-sqlite')` to this file
// on web only, so the rest of the data layer (which targets the same sync
// API) keeps working — data is in-memory only and resets on reload.

const NOT_SUPPORTED = (): never => {
  throw new Error(
    '[expo-sqlite.web-shim] Called a write op on the web shim. ' +
      'The web preview is read-only by design — switch to a native build for persistence.',
  );
};

export interface WebShimDbHandle {
  execSync(sql: string): void;
  runSync(sql: string, ...params: unknown[]): { lastInsertRowId: number; changes: number };
  getAllSync<T = unknown>(sql: string, ...params: unknown[]): T[];
  getFirstSync<T = unknown>(sql: string, ...params: unknown[]): T | null;
  withTransactionSync(fn: () => void): void;
  closeSync?(): void;
}

const INTERNAL: Record<string, unknown[]> = {};

function tableName(sql: string): string | null {
  const m = sql.match(/(?:FROM|INTO|UPDATE|TRUNCATE)\s+(\w+)/i);
  return m ? m[1] : null;
}

function handle(sql: string): unknown[] {
  const name = tableName(sql);
  if (!name) return [];
  if (!INTERNAL[name]) INTERNAL[name] = [];
  return INTERNAL[name]!;
}

export function openDatabaseSync(_name: string): WebShimDbHandle {
  return {
    execSync(_sql: string) {
      // web is intentionally read-only — schema is implicit
    },
    runSync(_sql: string, ..._params: unknown[]) {
      // writes are dropped on web (preview build)
      return { lastInsertRowId: 0, changes: 0 };
    },
    getAllSync<T = unknown>(sql: string): T[] {
      // Honour COUNT(*) and SELECT … FROM reads for schema/seed sanity.
      const lower = sql.toLowerCase();
      const countMatch = lower.match(/select\s+count\(\*\)\s+as\s+count\s+from\s+(\w+)/);
      if (countMatch) {
        const t = countMatch[1]!;
        return [{ count: (INTERNAL[t] ?? []).length } as unknown as T];
      }
      // Match the first table name; return a snapshot copy.
      const rows = handle(sql);
      return rows.slice() as T[];
    },
    getFirstSync<T = unknown>(sql: string): T | null {
      const rows = this.getAllSync<T>(sql);
      return rows[0] ?? null;
    },
    withTransactionSync(fn) {
      fn();
    },
  };
}

// Provide the full `expo-sqlite` sync API surface so any other consumer
// that imports this module on web still compiles.
export const openDatabaseSyncAsync = undefined as never;
export const openDatabaseAsync = undefined as never;
