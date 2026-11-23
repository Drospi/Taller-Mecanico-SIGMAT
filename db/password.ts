import crypto from 'node:crypto';

const PASSWORD_SALT = 'sigmat-taller-mecanico-2026-salt';

export function hashPassword(plainPassword: string): string {
  return crypto
    .scryptSync(plainPassword, PASSWORD_SALT, 32)
    .toString('hex');
}

export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  const computed = hashPassword(plainPassword);
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
