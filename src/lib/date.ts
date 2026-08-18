/**
 * Date helpers used across the leave app.
 * All dates are normalised to ISO YYYY-MM-DD strings for storage.
 */

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function isWorkingDay(d: Date): boolean {
  return !isWeekend(d);
}

export function countWorkingDays(start: Date, end: Date): number {
  if (end.getTime() < start.getTime()) return 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  let count = 0;
  while (cur.getTime() <= last.getTime()) {
    if (isWorkingDay(cur)) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function formatDateLong(value: string | Date): string {
  const d = typeof value === 'string' ? parseIsoDate(value) : value;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(value: string | Date): string {
  const d = typeof value === 'string' ? parseIsoDate(value) : value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateRange(start: string, end: string): string {
  if (start === end) return formatDateLong(start);
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  if (sameMonth) {
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.getDate()} ${e.getFullYear()}`;
  }
  if (sameYear) {
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${e.getFullYear()}`;
  }
  return `${formatDateShort(s)}, ${s.getFullYear()} – ${formatDateShort(e)}, ${e.getFullYear()}`;
}

export function monthLabel(year: number, month: number): string {
  // month is 0-indexed
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
