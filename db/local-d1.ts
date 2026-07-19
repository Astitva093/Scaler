import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

type D1Meta = {
  duration?: number;
  changes?: number;
  last_row_id?: number;
  rows_read?: number;
  rows_written?: number;
};

type D1Result<T = unknown> = {
  results: T[];
  success: boolean;
  error?: string;
  meta: D1Meta;
};

type StatementMode = "all" | "run" | "raw";
type SqlValue = null | number | bigint | string | NodeJS.ArrayBufferView;

function getLocalDatabasePath() {
  return resolve(process.cwd(), process.env.SITES_SQLITE_PATH ?? ".sites-runtime/airbnb.db");
}

function normalizeSql(query: string) {
  return query.trim().replace(/;\s*$/, "");
}

function isQueryReturningRows(query: string) {
  const normalized = normalizeSql(query).toLowerCase();
  return (
    normalized.startsWith("select") ||
    normalized.startsWith("with") ||
    normalized.startsWith("pragma") ||
    normalized.startsWith("explain") ||
    /\breturning\b/i.test(normalized)
  );
}

function toD1Meta(result: { changes?: number | bigint; lastInsertRowid?: number | bigint } = {}): D1Meta {
  return {
    changes: Number(result.changes ?? 0),
    last_row_id: Number(result.lastInsertRowid ?? 0),
    duration: 0,
    rows_read: 0,
    rows_written: Number(result.changes ?? 0),
  };
}

class LocalD1PreparedStatement {
  constructor(
    private readonly database: DatabaseSync,
    readonly query: string,
    private readonly boundValues: SqlValue[] = [],
    private readonly mode: StatementMode = "all",
  ) {}

  bind(...values: SqlValue[]) {
    return new LocalD1PreparedStatement(this.database, this.query, values, this.mode);
  }

  async first<T = unknown>(column?: string): Promise<T | null> {
    const row = await this.getRecord();
    if (!row) return null;
    if (!column) return row as T;
    return ((row as Record<string, unknown>)[column] ?? null) as T | null;
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const stmt = this.database.prepare(this.query);
    const result = stmt.run(...this.boundValues);
    return {
      results: [],
      success: true,
      meta: toD1Meta(result),
    };
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const rows = await this.getRows();
    return {
      results: rows as T[],
      success: true,
      meta: {
        changes: 0,
        duration: 0,
        last_row_id: 0,
        rows_read: rows.length,
        rows_written: 0,
      },
    };
  }

  async raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[]> {
    const rows = await this.getRows(true);
    if (options?.columnNames) {
      return rows as T[];
    }
    return rows as T[];
  }

  private async getRows(asArrays = false) {
    const stmt = this.database.prepare(this.query);
    stmt.setReturnArrays(asArrays);
    return stmt.all(...this.boundValues);
  }

  private async getRecord() {
    const rows = await this.getRows();
    return rows[0] ?? null;
  }

  getMode() {
    return this.mode;
  }
}

class LocalD1Database {
  private readonly database: DatabaseSync;

  constructor(dbPath = getLocalDatabasePath()) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.database = new DatabaseSync(dbPath);
    this.database.exec("PRAGMA foreign_keys = ON;");
  }

  prepare(query: string) {
    return new LocalD1PreparedStatement(this.database, query, [], isQueryReturningRows(query) ? "all" : "run");
  }

  async batch<T = unknown>(statements: LocalD1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    for (const statement of statements) {
      results.push(statement.getMode() === "all" ? await statement.all<T>() : await statement.run<T>());
    }
    return results;
  }

  async exec(query: string) {
    this.database.exec(query);
    return { count: 1, duration: 0 };
  }

  async dump() {
    const file = getLocalDatabasePath();
    const bytes = await readFile(file);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
}

export function createLocalD1Database() {
  return new LocalD1Database() as unknown as D1Database;
}
