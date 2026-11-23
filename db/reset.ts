import fs from 'node:fs';
import { DB_CONFIG } from './config.ts';
import { closeDatabase, getDatabase } from './connection.ts';

function resetDatabase(): void {
  closeDatabase();
  const filesToRemove = [
    DB_CONFIG.filePath,
    `${DB_CONFIG.filePath}-wal`,
    `${DB_CONFIG.filePath}-shm`,
  ];
  for (const file of filesToRemove) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
  const db = getDatabase();
  const counts = Object.values(DB_CONFIG.tables).map((table) => {
    const row = db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number };
    return `${table}: ${row.total}`;
  });
  console.log('Base de datos SQLite SIGMAT reiniciada y poblada con éxito:');
  console.log(counts.join(' | '));
  closeDatabase();
}

resetDatabase();
