// filepath: src/lib/weather.ts
//
// Open-Meteo client. No API key required — perfect for a local-first demo
// app. Two endpoints are used:
//
//   1. /v1/search  — city name → lat/lon
//   2. /v1/forecast — lat/lon → current temperature + WMO weather code
//
// WMO weather codes are the same standard used by most weather services,
// so we map them once here to a small set of conditions the UI understands.

export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'drizzle'
  | 'snow'
  | 'thunderstorm'
  | 'unknown';

export interface CurrentWeather {
  /** Location label, e.g. "Bengaluru, IN". */
  location: string;
  /** Temperature in °C. */
  temperature: number;
  /** Wind speed in km/h. */
  windSpeed: number;
  /** Resolved condition. */
  condition: WeatherCondition;
  /** Human-friendly label, e.g. "Light rain". */
  label: string;
  /** ISO timestamp the reading was taken at. */
  observedAt: string;
}

interface GeocodeResult {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    country?: string;
    country_code?: string;
    admin1?: string;
  }>;
}

interface ForecastResult {
  current?: {
    time?: string;
    temperature_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
}

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function geocode(city: string): Promise<{
  latitude: number;
  longitude: number;
  label: string;
} | null> {
  const trimmed = city.trim();
  if (!trimmed) return null;
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`;
  const data = await fetchJson<GeocodeResult>(url);
  const first = data?.results?.[0];
  if (!first) return null;
  const label = [first.name, first.country_code ?? first.country]
    .filter(Boolean)
    .join(', ');
  return { latitude: first.latitude, longitude: first.longitude, label };
}

export async function fetchCurrentWeather(city: string): Promise<CurrentWeather | null> {
  const place = await geocode(city);
  if (!place) return null;
  const url = `${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`;
  const data = await fetchJson<ForecastResult>(url);
  const cur = data?.current;
  if (!cur || cur.temperature_2m == null || cur.weather_code == null) return null;
  const { condition, label } = wmoToCondition(cur.weather_code);
  return {
    location: place.label,
    temperature: Math.round(cur.temperature_2m),
    windSpeed: Math.round(cur.wind_speed_10m ?? 0),
    condition,
    label,
    observedAt: cur.time ?? new Date().toISOString(),
  };
}

/**
 * WMO weather code → condition + label.
 * Codes defined by WMO 4677; reference:
 * https://open-meteo.com/en/docs (Current weather variable, weather_code)
 */
function wmoToCondition(code: number): { condition: WeatherCondition; label: string } {
  if (code === 0) return { condition: 'clear', label: 'Clear' };
  if (code === 1) return { condition: 'partly-cloudy', label: 'Mainly clear' };
  if (code === 2) return { condition: 'partly-cloudy', label: 'Partly cloudy' };
  if (code === 3) return { condition: 'cloudy', label: 'Overcast' };
  if (code === 45 || code === 48) return { condition: 'fog', label: 'Fog' };
  if (code >= 51 && code <= 57) return { condition: 'drizzle', label: 'Drizzle' };
  if (code >= 61 && code <= 67) return { condition: 'rain', label: 'Rain' };
  if (code >= 71 && code <= 77) return { condition: 'snow', label: 'Snow' };
  if (code >= 80 && code <= 82) return { condition: 'rain', label: 'Rain showers' };
  if (code === 85 || code === 86) return { condition: 'snow', label: 'Snow showers' };
  if (code === 95) return { condition: 'thunderstorm', label: 'Thunderstorm' };
  if (code === 96 || code === 99) return { condition: 'thunderstorm', label: 'Thunderstorm with hail' };
  return { condition: 'unknown', label: 'Unknown' };
}
