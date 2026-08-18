import type { LeaveType } from './types';

/**
 * Static catalogue of leave types the app supports.
 * Stored in code because the set is small and seeded into the DB.
 */
export const LEAVE_TYPES: readonly LeaveType[] = [
  {
    key: 'annual',
    label: 'Annual Leave',
    short: 'A',
    color: '#3C87F7',
    paid: true,
    requiresReason: false,
  },
  {
    key: 'sick',
    label: 'Sick Leave',
    short: 'S',
    color: '#E5484D',
    paid: true,
    requiresReason: false,
  },
  {
    key: 'personal',
    label: 'Personal',
    short: 'P',
    color: '#8B5CF6',
    paid: true,
    requiresReason: true,
  },
  {
    key: 'compassionate',
    label: 'Compassionate',
    short: 'C',
    color: '#F5A524',
    paid: true,
    requiresReason: true,
  },
  {
    key: 'unpaid',
    label: 'Unpaid Leave',
    short: 'U',
    color: '#6B7280',
    paid: false,
    requiresReason: true,
  },
] as const;

const LEAVE_TYPE_BY_KEY: Record<string, LeaveType> = LEAVE_TYPES.reduce(
  (acc, t) => {
    acc[t.key] = t;
    return acc;
  },
  {} as Record<string, LeaveType>,
);

export function getLeaveType(key: string): LeaveType | undefined {
  return LEAVE_TYPE_BY_KEY[key];
}

export function requireLeaveType(key: string): LeaveType {
  const t = LEAVE_TYPE_BY_KEY[key];
  if (!t) {
    throw new Error(`Unknown leave type: ${key}`);
  }
  return t;
}
