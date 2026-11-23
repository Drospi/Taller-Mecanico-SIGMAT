export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPlate(placa: string): boolean {
  return /^[A-Za-z0-9-]{4,10}$/.test(placa.trim());
}

export function isValidYear(anio: number): boolean {
  return Number.isInteger(anio) && anio >= 1950 && anio <= 2035;
}

export function isPositiveInt(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function isNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
