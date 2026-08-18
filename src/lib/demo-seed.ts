import { isoDate } from './date';
import { createLeaveRequest, listLeaveRequests } from './leave-repo';

/**
 * Inserts a few demo leave requests if the user has none yet.
 * Safe to call on every app start — it no-ops once data exists.
 */
export function ensureDemoData(): void {
  if (listLeaveRequests().length > 0) return;

  const today = new Date();
  const year = today.getFullYear();

  const past = new Date(year, today.getMonth() - 1, 14);
  const pastEnd = new Date(year, today.getMonth() - 1, 16);
  try {
    createLeaveRequest({
      typeKey: 'annual',
      startDate: past,
      endDate: pastEnd,
      status: 'approved',
      reason: 'Family weekend',
    });
  } catch {
    // ignore
  }

  const upcoming = new Date(year, today.getMonth() + 1, 5);
  const upcomingEnd = new Date(year, today.getMonth() + 1, 9);
  try {
    createLeaveRequest({
      typeKey: 'annual',
      startDate: upcoming,
      endDate: upcomingEnd,
      status: 'pending',
      reason: 'Planned trip',
    });
  } catch {
    // ignore
  }

  const sick = new Date(today);
  sick.setDate(today.getDate() - 7);
  try {
    createLeaveRequest({
      typeKey: 'sick',
      startDate: sick,
      endDate: sick,
      status: 'approved',
    });
  } catch {
    // ignore
  }

  const personal = new Date(year, today.getMonth() + 2, 18);
  try {
    createLeaveRequest({
      typeKey: 'personal',
      startDate: personal,
      endDate: personal,
      status: 'pending',
      reason: 'Personal appointment',
    });
  } catch {
    // ignore
  }

  // Sanity reference to isoDate so the import isn't tree-shaken if unused.
  void isoDate;
}
