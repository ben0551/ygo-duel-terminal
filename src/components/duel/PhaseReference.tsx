"use client";

import * as React from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { useDuel } from "@/hooks/useDuel";
import { GENERAL_TIPS, PHASE_GUIDES } from "@/lib/phase-guide";
import { PHASES, PHASE_LABELS, type Phase } from "@/types/duel";
import { cn } from "@/lib/utils";

/**
 * Reference list of every phase.
 *
 * The current phase's actions are shown by <CurrentPhaseCard />, which stays
 * visible on both tabs — this list is the "and what about the other phases?"
 * companion, so it only holds the expandable reference plus general tips.
 */
export function PhaseReference() {
  const { state } = useDuel();
  const currentPhase = state.currentPhase;

  const [expanded, setExpanded] = React.useState<Phase | null>(currentPhase);
  const [trackedPhase, setTrackedPhase] = React.useState(currentPhase);

  /**
   * Keep the reference following the tracker as phases advance.
   *
   * This is React's documented "adjust state when a prop changes" pattern:
   * comparing during render and re-rendering immediately, instead of running
   * an effect that would render twice with stale output in between.
   */
  if (trackedPhase !== currentPhase) {
    setTrackedPhase(currentPhase);
    setExpanded(currentPhase);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink">All phases</h3>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 scroll-slim">
        {PHASES.map((phase) => {
          const guide = PHASE_GUIDES[phase];
          const isOpen = expanded === phase;
          const isCurrent = phase === currentPhase;
          return (
            <div
              key={phase}
              className={cn(
                "overflow-hidden rounded-lg border transition-colors",
                isCurrent ? "border-accent/35 bg-accent/6" : "border-white/8 bg-white/3",
              )}
            >
              <h4>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`phase-guide-${phase}`}
                  onClick={() => setExpanded(isOpen ? null : phase)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider",
                      isCurrent ? "text-accent" : "text-ink/80",
                    )}
                  >
                    {PHASE_LABELS[phase]}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "size-3.5 shrink-0 text-muted transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
              </h4>

              {isOpen && (
                <div id={`phase-guide-${phase}`} className="space-y-1.5 px-3 pb-3">
                  <p className="text-[11px] leading-snug text-muted">{guide.summary}</p>
                  <ul className="space-y-1">
                    {guide.actions.map((action) => (
                      <li key={action} className="flex gap-1.5 text-[11px] leading-snug text-ink/75">
                        <span aria-hidden="true" className="text-success">
                          &bull;
                        </span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                  {guide.warnings.map((warning) => (
                    <p
                      key={warning}
                      className="flex gap-1.5 text-[11px] leading-snug text-[#FFC9D4]/85"
                    >
                      <span aria-hidden="true">&bull;</span>
                      <span>{warning}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-2 rounded-lg border border-white/8 bg-white/3 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F5C24B]">
            <Lightbulb aria-hidden="true" className="size-3.5" />
            Good to know
          </p>
          <ul className="space-y-1.5">
            {GENERAL_TIPS.map((tip) => (
              <li key={tip} className="flex gap-1.5 text-[11px] leading-snug text-ink/70">
                <span aria-hidden="true" className="text-[#F5C24B]">
                  &bull;
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
