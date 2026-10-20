import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format integer CAD cents to localized Canadian currency string.
 * e.g. 6850000 -> "$68,500 CAD" or "$68,500"
 */
export function formatCadCents(cents: number, showCurrencyCode = true): string {
  const formatted = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);

  return showCurrencyCode ? `${formatted} CAD` : formatted;
}

export const formatCentsToCAD = formatCadCents;

