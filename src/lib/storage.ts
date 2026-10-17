/**
 * localStorage persistence.
 *
 * Every access is wrapped: Safari private mode, disabled storage, and
 * server-side rendering all throw or are simply absent, and none of those
 * should break the app.
 */

import { sanitizeState } from "@/lib/duel";
import type { DuelState } from "@/types/duel";

export const STORAGE_KEY = "ygo-duel-terminal:v1";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Accessing localStorage can throw when storage is blocked entirely.
    return null;
  }
}

/** Read and validate the saved duel. Returns null when nothing is stored. */
export function loadDuelState(): DuelState | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitizeState(JSON.parse(raw));
  } catch {
    // Corrupt JSON: fall back to a fresh duel rather than crashing.
    return null;
  }
}

export function saveDuelState(state: DuelState): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or storage disabled — persistence is best-effort.
  }
}

export function clearDuelState(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Generic string-keyed persistence for small UI preferences. */
export function loadPreference<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const storage = getStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return allowed.includes(raw as T) ? (raw as T) : fallback;
  } catch {
    return fallback;
  }
}

export function savePreference(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
