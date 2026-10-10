export const PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
] as const;

export type ProvinceCode = (typeof PROVINCES)[number]["code"];

export const PROVINCE_CODES = PROVINCES.map((p) => p.code) as [ProvinceCode, ...ProvinceCode[]];

// Canada Post forward sortation: the first letter of a postal code identifies the province.
// X is shared by NT and NU, so it maps to NT as a suggestion only.
const POSTAL_PREFIX_TO_PROVINCE: Record<string, ProvinceCode> = {
  A: "NL", B: "NS", C: "PE", E: "NB",
  G: "QC", H: "QC", J: "QC",
  K: "ON", L: "ON", M: "ON", N: "ON", P: "ON",
  R: "MB", S: "SK", T: "AB", V: "BC", X: "NT", Y: "YT",
};

const POSTAL_CODE_PATTERN = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/;

export function normalizePostalCode(input: string): string {
  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return compact.length > 3 ? `${compact.slice(0, 3)} ${compact.slice(3)}` : compact;
}

export function isValidPostalCode(input: string): boolean {
  return POSTAL_CODE_PATTERN.test(normalizePostalCode(input));
}

export function suggestProvinceFromPostal(input: string): ProvinceCode | null {
  const first = input.trim().charAt(0).toUpperCase();
  return POSTAL_PREFIX_TO_PROVINCE[first] ?? null;
}

// Returns the 10 national digits of a Canadian/NANP number, or null if it cannot be one.
export function toNationalPhoneDigits(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  // NANP area codes and exchanges never start with 0 or 1.
  if (/^[01]/.test(digits) || /^[01]/.test(digits.slice(3))) return null;
  return digits;
}

export function formatPhoneDisplay(input: string): string {
  const digits = input.replace(/\D/g, "").replace(/^1(?=\d{10})/, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
