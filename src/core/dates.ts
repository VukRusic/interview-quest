/** A local calendar day, formatted `YYYY-MM-DD`. */
export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse a key as UTC noon so date math never drifts across DST changes. */
function toUtcNoon(k: DayKey): number {
  const [y, m, d] = k.split('-').map(Number);
  return Date.UTC(y, m - 1, d, 12);
}

export function isDayKey(k: unknown): k is DayKey {
  return typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && !Number.isNaN(toUtcNoon(k));
}

export function addDays(k: DayKey, n: number): DayKey {
  const d = new Date(toUtcNoon(k) + n * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((toUtcNoon(b) - toUtcNoon(a)) / 86_400_000);
}
