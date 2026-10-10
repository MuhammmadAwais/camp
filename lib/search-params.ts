export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function firstParam(value: string | string[] | undefined): string | null {
  const first = Array.isArray(value) ? value[0] : value;
  return first && first.length > 0 ? first : null;
}
