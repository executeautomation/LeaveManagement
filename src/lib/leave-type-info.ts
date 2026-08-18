// filepath: src/lib/leave-type-info.ts
//
// Per-leave-type detail copy used by the dashboard's info modal.
// Kept here (not in leave-types.ts) so the static catalogue stays
// data-only and the prose can evolve without churn.

import type { LeaveTypeKey } from './types';

export interface LeaveTypeInfo {
  /** One-line subtitle shown under the type label in the modal. */
  tagline: string;
  /** What the leave is for. 2-3 short sentences, plain language. */
  description: string;
  /** When it makes sense to apply. */
  whenToUse: string[];
  /** Notes / caveats (reason required, unpaid, etc). */
  notes: string[];
}

export const LEAVE_TYPE_INFO: Record<LeaveTypeKey, LeaveTypeInfo> = {
  annual: {
    tagline: 'Paid time off for holidays, rest or personal plans.',
    description:
      'Your regular holiday quota for the calendar year. Use it for ' +
      'trips, family time, or anything that needs you away from work ' +
      'and fully recharged.',
    whenToUse: [
      'Planned holidays or travel',
      'Long weekends or personal time off',
      'Recharging before a busy period',
    ],
    notes: [
      'Counts against your annual entitlement',
      'Submit early so your team can plan around it',
    ],
  },
  sick: {
    tagline: 'For when you are unwell or unfit to work.',
    description:
      'Use this for any illness, injury, or recovery period that keeps ' +
      'you from working normally. You do not need to give a detailed ' +
      'medical reason, only the dates you will be out.',
    whenToUse: [
      'Common illness (cold, flu, fever)',
      'Medical appointments or recovery',
      'Mental health days when you need rest',
    ],
    notes: [
      'No reason required — just the dates',
      'Let your manager know as soon as you can',
    ],
  },
  personal: {
    tagline: 'Paid personal time away from work.',
    description:
      'For personal matters that do not fit the other leave types — ' +
      'appointments, errands, family commitments, or anything else ' +
      'that needs your daytime attention.',
    whenToUse: [
      'Personal appointments (bank, legal, household)',
      'Family or childcare commitments',
      'Religious or cultural observances',
    ],
    notes: [
      'Counts against your annual entitlement',
      'A short reason is required for the team',
    ],
  },
  compassionate: {
    tagline: 'For bereavement, serious illness, or family emergencies.',
    description:
      'Time off to deal with a serious personal or family situation. ' +
      'This covers bereavement, a close family member being seriously ' +
      'ill, or other urgent personal emergencies.',
    whenToUse: [
      'Bereavement — loss of a loved one',
      'Serious illness of a close family member',
      'Unexpected family emergencies',
    ],
    notes: [
      'Counts against your annual entitlement',
      'A short reason helps your manager process it quickly',
    ],
  },
  unpaid: {
    tagline: 'Extended leave beyond your paid entitlement.',
    description:
      'Time off that goes past your paid balance or is taken as a ' +
      'longer career break. You are off work but not paid for these ' +
      'days — agree the duration with your manager first.',
    whenToUse: [
      'Extended travel or sabbatical',
      'Long personal or family needs',
      'When paid balances are fully used',
    ],
    notes: [
      'Unpaid — no salary for these days',
      'A reason is required for the record',
      'Confirm the duration with your manager before applying',
    ],
  },
};

export function getLeaveTypeInfo(key: LeaveTypeKey): LeaveTypeInfo {
  return LEAVE_TYPE_INFO[key];
}