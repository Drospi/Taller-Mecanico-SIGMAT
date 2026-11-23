import type { Plugin } from 'vite';
import { getDatabase } from './connection.ts';
import { handleApiRequest } from './apiRouter.ts';

/**
 * Plugin de Vite que inicializa SQLite (db/sigmat.sqlite) y expone
 * la API REST completa de SIGMAT tanto en `npm run dev` como en `npm run preview`.
 */
export function sigmatSqlitePlugin(): Plugin {
  return {
    name: 'sigmat-sqlite-api',
    configureServer(server) {
      getDatabase();
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          next();
          return;
        }
        void handleApiRequest(req, res).catch((err) => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : 'Error inesperado en la API SQLite.',
            })
          );
        });
      });
    },
    configurePreviewServer(server) {
      getDatabase();
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          next();
          return;
        }
        void handleApiRequest(req, res).catch((err) => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : 'Error inesperado en la API SQLite.',
            })
          );
        });
      });
    },
  };
}
