"use client";

import { useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { createInitialState, duelReducer } from "@/lib/duel";
import { loadDuelState, saveDuelState } from "@/lib/storage";
import { DuelContext, type DuelContextValue } from "@/components/providers/duel-context";

/**
 * Owns the duel state for the whole app.
 *
 * Hydration strategy: the reducer always starts from a fresh duel, so the
 * markup the server renders and the markup the client renders on its first
 * pass are identical — no hydration mismatch. Persisted state is merged in
 * from an effect after mount, which is the only place localStorage can be read
 * without breaking SSR.
 */
export function DuelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(duelReducer, undefined, () => createInitialState());

  /**
   * Guards the save effect. The first save-effect run happens in the same
   * commit as the restore effect, before the HYDRATE dispatch has re-rendered,
   * so writing then would clobber the stored duel with the defaults. Skipping
   * exactly one run fixes that without any extra render state.
   */
  const skipFirstSave = useRef(true);

  // Restore once, after mount.
  useEffect(() => {
    const saved = loadDuelState();
    if (saved) dispatch({ type: "HYDRATE", state: saved });
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    saveDuelState(state);
  }, [state]);

  const value = useMemo<DuelContextValue>(() => ({ state, dispatch }), [state]);

  return <DuelContext.Provider value={value}>{children}</DuelContext.Provider>;
}
