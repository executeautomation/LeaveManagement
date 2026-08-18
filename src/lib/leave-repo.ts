import { countWorkingDays, isoDate, nowIso } from './date';
import { getDb } from './db';
import { LEAVE_TYPES, requireLeaveType } from './leave-types';
import { DEFAULT_BALANCES } from './seed';
import type {
    BalanceSummary,
    LeaveRequest,
    LeaveRequestWithType,
    LeaveStatus,
    LeaveType,
    LeaveTypeBalance,
} from './types';

interface LeaveRequestRow {
  id: string;
  type_key: string;
  start_date: string;
  end_date: string;
  days: number;
  status: LeaveStatus;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRequest(row: LeaveRequestRow): LeaveRequest {
  return {
    id: row.id,
    typeKey: row.type_key as LeaveRequest['typeKey'],
    startDate: row.start_date,
    endDate: row.end_date,
    days: row.days,
    status: row.status,
    reason: row.reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function withType(r: LeaveRequest): LeaveRequestWithType {
  return { ...r, type: requireLeaveType(r.typeKey) };
}

export interface CreateLeaveRequestInput {
  typeKey: LeaveRequest['typeKey'];
  startDate: Date;
  endDate: Date;
  reason?: string | null;
  status?: LeaveStatus;
}

export function listLeaveRequests(): LeaveRequestWithType[] {
  const db = getDb();
  const rows = db.getAllSync<LeaveRequestRow>(
    `SELECT id, type_key, start_date, end_date, days, status, reason, created_at, updated_at
     FROM leave_requests
     ORDER BY start_date DESC, created_at DESC`,
  );
  return rows.map((r) => withType(rowToRequest(r)));
}

export function listLeaveRequestsByMonth(year: number, month: number): LeaveRequestWithType[] {
  // month is 0-indexed
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const startStr = isoDate(start);
  const endStr = isoDate(end);
  const db = getDb();
  const rows = db.getAllSync<LeaveRequestRow>(
    `SELECT id, type_key, start_date, end_date, days, status, reason, created_at, updated_at
     FROM leave_requests
     WHERE start_date <= ? AND end_date >= ?
     ORDER BY start_date ASC`,
    endStr,
    startStr,
  );
  return rows.map((r) => withType(rowToRequest(r)));
}

export function getLeaveRequest(id: string): LeaveRequestWithType | null {
  const db = getDb();
  const row = db.getFirstSync<LeaveRequestRow>(
    `SELECT id, type_key, start_date, end_date, days, status, reason, created_at, updated_at
     FROM leave_requests WHERE id = ?`,
    id,
  );
  return row ? withType(rowToRequest(row)) : null;
}

export function createLeaveRequest(input: CreateLeaveRequestInput): LeaveRequestWithType {
  if (input.endDate.getTime() < input.startDate.getTime()) {
    throw new Error('End date must be on or after start date');
  }
  const days = countWorkingDays(input.startDate, input.endDate);
  if (days <= 0) {
    throw new Error('Selected range contains no working days');
  }
  const id = generateId();
  const now = nowIso();
  const startDate = isoDate(input.startDate);
  const endDate = isoDate(input.endDate);
  const status = input.status ?? 'pending';
  const reason = input.reason?.trim() ? input.reason.trim() : null;

  const db = getDb();
  db.runSync(
    `INSERT INTO leave_requests
       (id, type_key, start_date, end_date, days, status, reason, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.typeKey,
    startDate,
    endDate,
    days,
    status,
    reason,
    now,
    now,
  );

  return withType({
    id,
    typeKey: input.typeKey,
    startDate,
    endDate,
    days,
    status,
    reason,
    createdAt: now,
    updatedAt: now,
  });
}

export function updateLeaveRequestStatus(id: string, status: LeaveStatus): LeaveRequestWithType {
  const db = getDb();
  const now = nowIso();
  db.runSync(
    `UPDATE leave_requests SET status = ?, updated_at = ? WHERE id = ?`,
    status,
    now,
    id,
  );
  const updated = getLeaveRequest(id);
  if (!updated) throw new Error(`Leave request ${id} not found after update`);
  return updated;
}

export function deleteLeaveRequest(id: string): void {
  const db = getDb();
  db.runSync(`DELETE FROM leave_requests WHERE id = ?`, id);
}

export function listBalances(year: number = new Date().getFullYear()): LeaveTypeBalance[] {
  const db = getDb();
  return db.getAllSync<LeaveTypeBalance>(
    `SELECT year, type_key as typeKey, allocated
     FROM leave_balances
     WHERE year = ?
     ORDER BY type_key`,
    year,
  );
}

/**
 * Returns one BalanceSummary per leave type, for the given year.
 * Includes used + pending day counts derived from leave_requests.
 *
 * If the leave_balances table is empty for the year (e.g. on the read-only
 * web shim, which doesn't persist writes), falls back to the static
 * DEFAULT_BALANCES seed so the UI still shows meaningful numbers.
 */
export function getBalanceSummaries(year: number = new Date().getFullYear()): BalanceSummary[] {
  const db = getDb();
  const balances = listBalances(year);

  const usage = db.getAllSync<{ type_key: string; status: LeaveStatus; days: number }>(
    `SELECT type_key, status, days FROM leave_requests
     WHERE substr(start_date, 1, 4) = ?`,
    String(year),
  );

  const usageByType = new Map<string, { used: number; pending: number }>();
  for (const u of usage) {
    const cur = usageByType.get(u.type_key) ?? { used: 0, pending: 0 };
    if (u.status === 'approved') cur.used += u.days;
    else if (u.status === 'pending') cur.pending += u.days;
    usageByType.set(u.type_key, cur);
  }

  // Build the per-type allocated map: prefer real DB rows, fall back to
  // DEFAULT_BALANCES so the UI shows seeded values even on the read-only
  // web shim.
  const allocatedByType = new Map<string, number>();
  for (const b of balances) allocatedByType.set(b.typeKey, b.allocated);
  if (allocatedByType.size === 0) {
    for (const d of DEFAULT_BALANCES) allocatedByType.set(d.typeKey, d.allocated);
  }

  return LEAVE_TYPES.map((type) => {
    const stat = usageByType.get(type.key) ?? { used: 0, pending: 0 };
    const allocated = allocatedByType.get(type.key) ?? 0;
    return {
      typeKey: type.key,
      allocated,
      used: stat.used,
      pending: stat.pending,
      remaining: Math.max(0, allocated - stat.used),
    };
  });
}

export function listLeaveTypesFromDb(): LeaveType[] {
  const db = getDb();
  const rows = db.getAllSync<{
    key: string;
    label: string;
    short: string;
    color: string;
    paid: number;
    requires_reason: number;
  }>(`SELECT key, label, short, color, paid, requires_reason FROM leave_types ORDER BY sort_order`);
  return rows.map((r) => ({
    key: r.key as LeaveType['key'],
    label: r.label,
    short: r.short,
    color: r.color,
    paid: r.paid === 1,
    requiresReason: r.requires_reason === 1,
  }));
}

function generateId(): string {
  // Random enough for local-only use; uses timestamp + random suffix.
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rand}`;
}
