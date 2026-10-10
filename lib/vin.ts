// ISO 3779 / 49 CFR 565 VIN validation, shared by the client form and the API route.

const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

const POSITION_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

// I, O and Q are never valid VIN characters.
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export function sanitizeVinInput(input: string): string {
  return input.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
}

export function computeVinCheckDigit(vin: string): string {
  const sum = vin.split("").reduce((total, char, index) => {
    const value = /\d/.test(char) ? Number(char) : TRANSLITERATION[char] ?? 0;
    return total + value * POSITION_WEIGHTS[index];
  }, 0);
  const remainder = sum % 11;
  return remainder === 10 ? "X" : String(remainder);
}

export function isValidVin(vin: string): boolean {
  if (!VIN_PATTERN.test(vin)) return false;
  return vin.charAt(8) === computeVinCheckDigit(vin);
}
