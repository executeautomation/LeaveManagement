// filepath: src/lib/auth.ts
//
// Single hardcoded credential + a tiny in-memory subscription so the
// `AuthGate` re-renders the moment the user signs in/out.
//
// Native persistence: on iOS/Android the username is stored in the same
// `settings` SQLite table that backs `lib/settings.ts`, so the gate can
// re-hydrate on app launch without a round-trip through the network.
//
// Web persistence: the expo-sqlite web shim is intentionally read-only
// (writes are dropped — see `expo-sqlite.web-shim.ts`), so on web we only
// hold the auth state in module memory for the lifetime of the page. That
// is fine for the preview build; on native builds the gate survives
// restarts.

import { useEffect, useState } from 'react';

import { getDb } from './db';

const SESSION_KEY = 'session.username';

export const CREDENTIALS = {
  username: 'admin',
  password: 'password',
} as const;

type Listener = (signedIn: boolean) => void;
const listeners = new Set<Listener>();

let _signedIn: boolean | null = null;

function readPersisted(): string | null {
  try {
    const db = getDb();
    const row = db.getFirstSync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      SESSION_KEY,
    );
    const v = row?.value?.trim() ? row.value.trim() : null;
    console.log('[AUTH] readPersisted key=', SESSION_KEY, 'row=', row, '->', v);
    return v;
  } catch (e) {
    console.log('[AUTH] readPersisted threw', e);
    return null;
  }
}

function writePersisted(username: string | null): void {
  try {
    const db = getDb();
    if (username === null) {
      db.runSync('DELETE FROM settings WHERE key = ?', SESSION_KEY);
      return;
    }
    db.runSync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      SESSION_KEY,
      username,
    );
  } catch {
    // Web shim throws on writes; that's expected — fall back to in-memory.
  }
}

function setSignedIn(value: boolean, username: string | null): void {
  _signedIn = value;
  for (const listener of listeners) listener(value);
  if (value && username) writePersisted(username);
  else writePersisted(null);
}

export function isSignedIn(): boolean {
  console.log('[AUTH] isSignedIn called, _signedIn was', _signedIn);
  if (_signedIn !== null) return _signedIn;
  _signedIn = readPersisted() !== null;
  console.log('[AUTH] isSignedIn -> _signedIn=', _signedIn);
  return _signedIn;
}

export function getSignedInUser(): string | null {
  return readPersisted();
}

export type SignInResult =
  | { ok: true; username: string }
  | { ok: false; reason: 'invalid-credentials' };

export function signIn(username: string, password: string): SignInResult {
  const u = username.trim();
  const p = password;
  if (
    u.toLowerCase() === CREDENTIALS.username.toLowerCase() &&
    p === CREDENTIALS.password
  ) {
    setSignedIn(true, u);
    return { ok: true, username: u };
  }
  return { ok: false, reason: 'invalid-credentials' };
}

export function signOut(): void {
  setSignedIn(false, null);
}

/**
 * Subscribe to auth state. Returns the current value immediately and
 * re-renders the caller whenever the signed-in flag flips.
 */
export function useAuth(): { signedIn: boolean; username: string | null } {
  const [snapshot, setSnapshot] = useState<{ signedIn: boolean; username: string | null }>(
    () => ({ signedIn: isSignedIn(), username: getSignedInUser() }),
  );

  useEffect(() => {
    const listener: Listener = (signedIn) => {
      setSnapshot({ signedIn, username: getSignedInUser() });
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return snapshot;
}
