"use client";

import { createContext, type Dispatch } from "react";
import type { DuelAction } from "@/lib/duel";
import type { DuelState } from "@/types/duel";

export interface DuelContextValue {
  state: DuelState;
  dispatch: Dispatch<DuelAction>;
}

export const DuelContext = createContext<DuelContextValue | null>(null);
