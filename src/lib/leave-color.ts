// filepath: src/lib/leave-color.ts
//
// Single source of truth for resolving a leave-type's *theme-aware* color.
// The static `LeaveType.color` is used for DB persistence and the calendar
// day dots, but for UI surfaces (chips, balance bars, legend dots) we want
// the color to swap between light and dark mode so accents stay readable.

import type { Palette } from '@/constants/theme';
import type { LeaveTypeKey } from './types';

export function leaveTypeColor(palette: Palette, key: LeaveTypeKey): string {
  switch (key) {
    case 'sick':
      return palette.typeSick;
    case 'personal':
      return palette.typePersonal;
    case 'compassionate':
      return palette.typeCompassionate;
    case 'unpaid':
      return palette.typeUnpaid;
    case 'annual':
    default:
      return palette.typeAnnual;
  }
}
