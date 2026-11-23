import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { DB_CONFIG } from './config.ts';
import { createSchema } from './schema.ts';
import { seedDatabase } from './seed.ts';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DB_CONFIG.directory)) {
    fs.mkdirSync(DB_CONFIG.directory, { recursive: true });
  }

  const db = new DatabaseSync(DB_CONFIG.filePath);
  for (const pragma of DB_CONFIG.pragmas) {
    db.exec(pragma);
  }

  createSchema(db);
  seedDatabase(db);

  dbInstance = db;
  return dbInstance;
}

export function runInTransaction<T>(operation: (db: DatabaseSync) => T): T {
  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = operation(db);
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // Ignore rollback errors if transaction already aborted
    }
    throw error;
  }
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
