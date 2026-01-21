import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { CREATE_TABLES_SQL, INITIAL_SETTINGS, SCHEMA_VERSION } from './schema';

const DB_NAME = 'inspectos_db';

class Database {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private initialized = false;
  private platform: string;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.platform = Capacitor.getPlatform();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // For web, we need to initialize web store
      if (this.platform === 'web') {
        await this.sqlite.initWebStore();
      }

      // Check connection consistency (for recovering from crashes)
      const retCC = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

      if (retCC.result && isConn) {
        this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
      } else {
        this.db = await this.sqlite.createConnection(
          DB_NAME,
          false, // encrypted
          'no-encryption', // mode
          SCHEMA_VERSION, // version
          false // readonly
        );
      }

      await this.db.open();

      // Run migrations
      await this.runMigrations();

      this.initialized = true;
      console.log('[Database] Initialized successfully');
    } catch (error) {
      console.error('[Database] Initialization failed:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    // Create tables
    await this.db.execute(CREATE_TABLES_SQL);

    // Insert initial settings
    await this.db.execute(INITIAL_SETTINGS);

    console.log('[Database] Migrations completed');
  }

  async getConnection(): Promise<SQLiteDBConnection> {
    if (!this.initialized) {
      await this.initialize();
    }
    if (!this.db) throw new Error('Database not connected');
    return this.db;
  }

  // Generic query methods
  async query<T>(sql: string, values: unknown[] = []): Promise<T[]> {
    const db = await this.getConnection();
    const result = await db.query(sql, values);
    return (result.values || []) as T[];
  }

  async run(sql: string, values: unknown[] = []): Promise<{ changes: number; lastId: number }> {
    const db = await this.getConnection();
    const result = await db.run(sql, values);
    return {
      changes: result.changes?.changes || 0,
      lastId: result.changes?.lastId || 0
    };
  }

  async execute(sql: string): Promise<void> {
    const db = await this.getConnection();
    await db.execute(sql);
  }

  async executeSet(statements: { statement: string; values?: unknown[] }[]): Promise<void> {
    const db = await this.getConnection();
    await db.executeSet(statements);
  }

  // Transaction support
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const db = await this.getConnection();
    await db.execute('BEGIN TRANSACTION');
    try {
      const result = await fn();
      await db.execute('COMMIT');
      return result;
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  }

  // Close connection
  async close(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection(DB_NAME, false);
      this.db = null;
      this.initialized = false;
    }
  }

  // For web: save to IndexedDB
  async saveToStore(): Promise<void> {
    if (this.platform === 'web') {
      await this.sqlite.saveToStore(DB_NAME);
    }
  }
}

// Singleton instance
export const database = new Database();

// Type-safe table helpers
export type DbRow = Record<string, unknown>;

export function toBoolean(value: unknown): boolean {
  return value === 1 || value === '1' || value === true;
}

export function fromBoolean(value: boolean): number {
  return value ? 1 : 0;
}

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  return new Date(value as string);
}

export function fromDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString();
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}
