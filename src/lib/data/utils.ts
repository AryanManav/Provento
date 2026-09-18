/**
 * Supabase returns an embedded relation as an object or a single-element array
 * depending on how the join is inferred, so relation access is normalised here.
 */
export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
