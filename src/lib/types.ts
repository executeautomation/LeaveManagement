// Domain types for the leave-management app.

export type LeaveTypeKey = 'annual' | 'sick' | 'unpaid' | 'personal' | 'compassionate';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveType {
  /** Stable key used in the DB. */
  key: LeaveTypeKey;
  /** Human-readable label. */
  label: string;
  /** Single-character or short glyph used in chips. */
  short: string;
  /** Color used for badges / calendar events. */
  color: string;
  /** Whether this type counts against the annual paid balance. */
  paid: boolean;
  /** Whether this type requires a reason. */
  requiresReason: boolean;
}

export interface LeaveTypeBalance {
  /** Year this balance belongs to (e.g. 2026). */
  year: number;
  /** Foreign key into leave_types. */
  typeKey: LeaveTypeKey;
  /** Allocated days for the year. */
  allocated: number;
}

export interface LeaveRequest {
  id: string;
  typeKey: LeaveTypeKey;
  /** ISO date string (YYYY-MM-DD) of the first day. */
  startDate: string;
  /** ISO date string (YYYY-MM-DD) of the last day (inclusive). */
  endDate: string;
  /** Number of working days in the inclusive range. */
  days: number;
  status: LeaveStatus;
  reason: string | null;
  /** ISO timestamp of when the request was created. */
  createdAt: string;
  /** ISO timestamp of last status change. */
  updatedAt: string;
}

export interface LeaveRequestWithType extends LeaveRequest {
  type: LeaveType;
}

export interface BalanceSummary {
  typeKey: LeaveTypeKey;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
}
