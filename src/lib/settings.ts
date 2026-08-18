// filepath: src/lib/settings.ts
//
// Persistent key/value preferences backed by the `settings` table.
//
// Today this only stores the editable annual-leave quota and the user's
// weather city, but the same shape is what we'd reach for next time we want
// a per-user preference (notification windows, timezone, fiscal year
// start, etc.).

import { getDb } from './db';
import { DEFAULT_ANNUAL_TOTAL } from './seed';

const ANNUAL_TOTAL_KEY = 'annualTotal';
const WEATHER_CITY_KEY = 'weatherCity';

/**
 * Default city shown when the user has not configured one. Picked because
 * Open-Meteo has great coverage for it and "bengaluru" is a sensible
 * default for new users — easy to change in the Profile screen.
 */
export const DEFAULT_WEATHER_CITY = 'Bengaluru';

export function getAnnualTotal(): number {
  const db = getDb();
  const row = db.getFirstSync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    ANNUAL_TOTAL_KEY,
  );
  if (!row) return DEFAULT_ANNUAL_TOTAL;
  const n = Number.parseInt(row.value, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_ANNUAL_TOTAL;
}

export function setAnnualTotal(value: number): number {
  const sanitized = Math.max(0, Math.min(365, Math.floor(value)));
  const db = getDb();
  db.runSync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ANNUAL_TOTAL_KEY,
    String(sanitized),
  );
  return sanitized;
}

export function getWeatherCity(): string {
  const db = getDb();
  const row = db.getFirstSync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    WEATHER_CITY_KEY,
  );
  const value = row?.value?.trim();
  return value && value.length > 0 ? value : DEFAULT_WEATHER_CITY;
}

export function setWeatherCity(value: string): string {
  const sanitized = value.trim().slice(0, 80);
  if (sanitized.length === 0) return DEFAULT_WEATHER_CITY;
  const db = getDb();
  db.runSync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    WEATHER_CITY_KEY,
    sanitized,
  );
  return sanitized;
}
