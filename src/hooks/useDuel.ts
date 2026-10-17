"use client";

import { useContext } from "react";
import { DuelContext, type DuelContextValue } from "@/components/providers/duel-context";

/** Access the duel state and dispatcher. Throws outside of <DuelProvider>. */
export function useDuel(): DuelContextValue {
  const context = useContext(DuelContext);
  if (context === null) {
    throw new Error("useDuel must be used inside a <DuelProvider>");
  }
  return context;
}
