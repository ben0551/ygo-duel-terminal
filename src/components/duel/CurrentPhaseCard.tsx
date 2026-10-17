"use client";

import * as React from "react";
import { AlertTriangle, Check, ChevronDown, MapPin } from "lucide-react";
import { useDuel } from "@/hooks/useDuel";
import { PHASE_GUIDES } from "@/lib/phase-guide";
import { PHASE_LABELS } from "@/types/duel";
import { cn } from "@/lib/utils";

/**
 * The always-visible answer to "what can I do right now?".
 *
 * This deliberately sits OUTSIDE the Actions/Log tab panel: the legal actions
 * for the current phase are the single most useful thing on screen for a newer
 * player, so they stay visible even while reading the duel log.
 */
export function CurrentPhaseCard() {
  const { state } = useDuel();
  const [collapsed, setCollapsed] = React.useState(false);
  const guide = PHASE_GUIDES[state.currentPhase];

  return (
    <section
      aria-label={`${PHASE_LABELS[state.currentPhase]} — valid actions`}
      className="rounded-xl border border-accent/35 bg-gradient-to-br from-accent/10 to-accent-2/10"
    >
      <h3>
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-controls="current-phase-actions"
          onClick={() => setCollapsed((value) => !value)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
              You are here
            </span>
            <span className="block truncate bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-[13px] font-extrabold uppercase tracking-wide text-transparent">
              {PHASE_LABELS[state.currentPhase]}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-3.5 shrink-0 text-muted transition-transform",
              !collapsed && "rotate-180",
            )}
          />
        </button>
      </h3>

      {!collapsed && (
        <div id="current-phase-actions" className="space-y-2 px-3 pb-3">
          <p className="text-[11px] leading-snug text-ink/90">{guide.summary}</p>

          <ul className="space-y-1">
            {guide.actions.map((action) => (
              <li key={action} className="flex gap-1.5 text-[11px] leading-snug text-ink/85">
                <Check aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-success" />
                <span>{action}</span>
              </li>
            ))}
          </ul>

          {guide.warnings.length > 0 && (
            <ul className="space-y-1 border-t border-white/10 pt-2">
              {guide.warnings.map((warning) => (
                <li key={warning} className="flex gap-1.5 text-[11px] leading-snug text-[#FFC9D4]">
                  <AlertTriangle
                    aria-hidden="true"
                    className="mt-0.5 size-3 shrink-0 text-danger"
                  />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
