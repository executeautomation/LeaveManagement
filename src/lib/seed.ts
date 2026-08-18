import type { LeaveTypeKey } from './types';

export interface DefaultBalance {
  typeKey: LeaveTypeKey;
  allocated: number;
}

/**
 * Default balance for each leave type. The `annual` allocated also seeds the
 * user-editable "annual total" preference (see `db.ts → ensureSeed`).
 */
export const DEFAULT_BALANCES: readonly DefaultBalance[] = [
  { typeKey: 'annual', allocated: 20 },
  { typeKey: 'sick', allocated: 10 },
  { typeKey: 'personal', allocated: 5 },
  { typeKey: 'compassionate', allocated: 5 },
  { typeKey: 'unpaid', allocated: 30 },
];

/**
 * Initial value for the user-editable annual leave quota. Used as a fallback
 * if no balance row exists for the current year.
 */
export const DEFAULT_ANNUAL_TOTAL = 20;
