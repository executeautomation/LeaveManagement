import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
    getBalanceSummaries,
    listBalances,
    listLeaveRequests,
    listLeaveTypesFromDb,
} from './leave-repo';
import { LEAVE_TYPES } from './leave-types';
import { getAnnualTotal, getWeatherCity } from './settings';
import type {
    BalanceSummary,
    LeaveRequestWithType,
    LeaveType,
    LeaveTypeBalance,
} from './types';

export interface LeaveData {
  requests: LeaveRequestWithType[];
  balances: LeaveTypeBalance[];
  summaries: BalanceSummary[];
  types: LeaveType[];
  year: number;
  /** User-editable annual-leave quota. */
  annualTotal: number;
  /** User-configured city used for the dashboard weather card. */
  weatherCity: string;
  reload: () => void;
}

/**
 * Loads leave data on mount and re-loads whenever the screen is focused.
 * expo-router doesn't re-mount screens on tab focus, so useFocusEffect is the
 * standard way to keep data fresh across tab switches in SDK 57.
 *
 * On web the SQLite shim returns no rows, so the static `LEAVE_TYPES` catalog
 * is used as a fallback for the type list (the UI still renders).
 */
export function useLeaveData(): LeaveData {
  const year = new Date().getFullYear();
  const [requests, setRequests] = useState<LeaveRequestWithType[]>([]);
  const [balances, setBalances] = useState<LeaveTypeBalance[]>([]);
  const [summaries, setSummaries] = useState<BalanceSummary[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [annualTotal, setAnnualTotal] = useState<number>(0);
  const [weatherCity, setWeatherCity] = useState<string>('');

  const reload = useCallback(() => {
    setRequests(listLeaveRequests());
    setBalances(listBalances(year));
    setSummaries(getBalanceSummaries(year));
    const fromDb = listLeaveTypesFromDb();
    setTypes(fromDb.length > 0 ? fromDb : [...LEAVE_TYPES]);
    setAnnualTotal(getAnnualTotal());
    setWeatherCity(getWeatherCity());
  }, [year]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { requests, balances, summaries, types, year, annualTotal, weatherCity, reload };
}
