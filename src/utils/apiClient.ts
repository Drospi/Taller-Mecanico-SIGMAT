import { APP_CONFIG } from '../config/app.config';

let currentUserIdProvider: () => number | null = () => null;

export function registerAuthUserIdProvider(provider: () => number | null): void {
  currentUserIdProvider = provider;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const userId = currentUserIdProvider();
  if (userId) {
    headers['x-sigmat-user-id'] = String(userId);
  }

  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || `Error de comunicación con la base de datos (${response.status}).`);
  }

  return data;
}
