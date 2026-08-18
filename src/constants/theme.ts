/**
 * Design tokens. Three things live here:
 *   1. `Colors`     – semantic surface/text colors for light + dark.
 *   2. `Spacing`, `Radius`, `Shadow`, `Fonts` – non-color tokens.
 *   3. `BottomTabInset`, `MaxContentWidth` – layout conveniences used by screens.
 *
 * Touch the surfaces in `Colors` to re-skin the app — every screen reads from
 * `useTheme()` which returns the active scheme's table.
 */

import '@/global.css';

import { Platform } from 'react-native';

export interface Palette {
  // Brand
  accent: string;
  accentSoft: string;
  accentFg: string;
  // Surfaces
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceSelected: string;
  surfaceInverse: string;
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  // Lines + overlays
  border: string;
  borderStrong: string;
  scrim: string;
  // Semantic
  success: string;
  successSoft: string;
  successFg: string;
  warning: string;
  warningSoft: string;
  warningFg: string;
  danger: string;
  dangerSoft: string;
  dangerFg: string;
  info: string;
  infoSoft: string;
  infoFg: string;
  // Per-leave-type semantic colors reused in chips, charts, calendar dots.
  typeAnnual: string;
  typeAnnualFg: string;
  typeSick: string;
  typeSickFg: string;
  typePersonal: string;
  typePersonalFg: string;
  typeCompassionate: string;
  typeCompassionateFg: string;
  typeUnpaid: string;
  typeUnpaidFg: string;
}

export const Colors: { light: Palette; dark: Palette } = {
  light: {
    accent: '#3D5AFE',
    accentSoft: 'rgba(61, 90, 254, 0.10)',
    accentFg: '#FFFFFF',

    background: '#F6F7FB',
    surface: '#FFFFFF',
    surfaceMuted: '#EEF0F6',
    surfaceSelected: '#E4E7F2',
    surfaceInverse: '#0F1115',

    text: '#0F1115',
    textSecondary: '#5B6270',
    textMuted: '#8A92A2',
    textInverse: '#FFFFFF',

    border: 'rgba(15, 17, 21, 0.06)',
    borderStrong: 'rgba(15, 17, 21, 0.12)',
    scrim: 'rgba(15, 17, 21, 0.45)',

    success: '#1F8E4A',
    successSoft: '#E0F4E6',
    successFg: '#0F5128',
    warning: '#C58A0A',
    warningSoft: '#FFF4D6',
    warningFg: '#7A5600',
    danger: '#D0342F',
    dangerSoft: '#FBE2E1',
    dangerFg: '#8C1A18',
    info: '#3D5AFE',
    infoSoft: '#E2E5FF',
    infoFg: '#1E2DA0',

    typeAnnual: '#3D5AFE',
    typeAnnualFg: '#FFFFFF',
    typeSick: '#D0342F',
    typeSickFg: '#FFFFFF',
    typePersonal: '#8B5CF6',
    typePersonalFg: '#FFFFFF',
    typeCompassionate: '#C58A0A',
    typeCompassionateFg: '#FFFFFF',
    typeUnpaid: '#5B6270',
    typeUnpaidFg: '#FFFFFF',
  },
  dark: {
    accent: '#7B8CFF',
    accentSoft: 'rgba(123, 140, 255, 0.16)',
    accentFg: '#0F1115',

    background: '#0B0D11',
    surface: '#14181F',
    surfaceMuted: '#1B2029',
    surfaceSelected: '#242A36',
    surfaceInverse: '#FFFFFF',

    text: '#F2F4F8',
    textSecondary: '#A4ACBA',
    textMuted: '#6B7384',
    textInverse: '#0F1115',

    border: 'rgba(255, 255, 255, 0.06)',
    borderStrong: 'rgba(255, 255, 255, 0.12)',
    scrim: 'rgba(0, 0, 0, 0.55)',

    success: '#5BD183',
    successSoft: '#0F2B1B',
    successFg: '#9FE7B6',
    warning: '#F2C04E',
    warningSoft: '#2C2210',
    warningFg: '#F8DC92',
    danger: '#F4736E',
    dangerSoft: '#2E1413',
    dangerFg: '#F8B7B4',
    info: '#7B8CFF',
    infoSoft: '#161B30',
    infoFg: '#B6BFFA',

    typeAnnual: '#7B8CFF',
    typeAnnualFg: '#0F1115',
    typeSick: '#F4736E',
    typeSickFg: '#0F1115',
    typePersonal: '#A78BFA',
    typePersonalFg: '#0F1115',
    typeCompassionate: '#F2C04E',
    typeCompassionateFg: '#0F1115',
    typeUnpaid: '#A4ACBA',
    typeUnpaidFg: '#0F1115',
  },
} as const;

export type ThemeColor = keyof Palette;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const Shadow = {
  // RN accepts a CSS-ish shorthand per platform. We keep it light on Android/iOS
  // (hairline elevation) so dense cards stay legible.
  card: Platform.select({
    ios: {
      shadowColor: '#0F1115',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#0F1115',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }),
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Convenience: maps a leave-type key to its accent + foreground. */
export function typeColor(key: string): { bg: string; fg: string } {
  switch (key) {
    case 'sick':
      return { bg: Colors.light.typeSick, fg: Colors.light.typeSickFg };
    case 'personal':
      return { bg: Colors.light.typePersonal, fg: Colors.light.typePersonalFg };
    case 'compassionate':
      return { bg: Colors.light.typeCompassionate, fg: Colors.light.typeCompassionateFg };
    case 'unpaid':
      return { bg: Colors.light.typeUnpaid, fg: Colors.light.typeUnpaidFg };
    default:
      return { bg: Colors.light.typeAnnual, fg: Colors.light.typeAnnualFg };
  }
}
