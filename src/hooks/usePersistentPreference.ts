"use client";

import { useCallback, useSyncExternalStore } from "react";
import { loadPreference, savePreference } from "@/lib/storage";

/* ------------------------------------------------------------------ *
 * Preference store
 *
 * `useSyncExternalStore` is the right primitive for reading an external,
 * mutable source like localStorage: it avoids the "setState inside an effect"
 * cascade and keeps server and client renders consistent via a separate
 * server snapshot.
 * ------------------------------------------------------------------ */

const listeners = new Map<string, Set<() => void>>();

function subscribeToKey(key: string, onChange: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(onChange);
  return () => {
    set.delete(onChange);
  };
}

function notifyKey(key: string): void {
  listeners.get(key)?.forEach((listener) => listener());
}

/**
 * Persist a small string-valued UI preference (such as which side panel tab is
 * open) without polluting the duel state.
 */
export function usePersistentPreference<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): readonly [T, (value: T) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => subscribeToKey(key, onChange),
    [key],
  );

  const getSnapshot = useCallback(
    () => loadPreference(key, allowed, fallback),
    [key, allowed, fallback],
  );

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback(
    (next: T) => {
      savePreference(key, next);
      notifyKey(key);
    },
    [key],
  );

  return [value, update] as const;
}

/* ------------------------------------------------------------------ *
 * Media queries
 * ------------------------------------------------------------------ */

const mediaQueryCache = new Map<string, MediaQueryList>();

function getMediaQueryList(query: string): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  let list = mediaQueryCache.get(query);
  if (!list) {
    list = window.matchMedia(query);
    mediaQueryCache.set(query, list);
  }
  return list;
}

/** Track a CSS media query, SSR-safely (false on the server). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const list = getMediaQueryList(query);
    if (!list) return () => {};
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  const getSnapshot = useCallback(() => getMediaQueryList(query)?.matches ?? false, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
