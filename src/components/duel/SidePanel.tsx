"use client";

import { BookOpen, ScrollText } from "lucide-react";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { CurrentPhaseCard } from "@/components/duel/CurrentPhaseCard";
import { DuelLog } from "@/components/duel/DuelLog";
import { PhaseReference } from "@/components/duel/PhaseReference";
import { useDuel } from "@/hooks/useDuel";
import { usePersistentPreference } from "@/hooks/usePersistentPreference";
import type { SidePanelTab } from "@/types/duel";

const SIDE_PANEL_KEY = "ygo-duel-terminal:side-panel";
const SIDE_PANEL_TABS = ["actions", "log"] as const satisfies readonly SidePanelTab[];

/**
 * The right-hand panel.
 *
 * Layout, top to bottom:
 *   1. The Actions/Log toggle.
 *   2. <CurrentPhaseCard /> — the current phase's legal actions. This is
 *      OUTSIDE the tabs on purpose, so it stays on screen while reading the
 *      duel log. It is collapsible for players who do not need it.
 *   3. The selected tab: the all-phases reference, or the duel log.
 *
 * The chosen tab is remembered between sessions.
 */
export function SidePanel() {
  const { state } = useDuel();
  const [tab, setTab] = usePersistentPreference<SidePanelTab>(
    SIDE_PANEL_KEY,
    SIDE_PANEL_TABS,
    "log",
  );

  const options: readonly SegmentedOption<SidePanelTab>[] = [
    {
      value: "actions",
      label: "All phases",
      icon: <BookOpen aria-hidden="true" className="size-3.5" />,
    },
    {
      value: "log",
      label: "Log",
      icon: <ScrollText aria-hidden="true" className="size-3.5" />,
      badge: state.log.length,
      ariaLabel: `Log, ${state.log.length} ${state.log.length === 1 ? "entry" : "entries"}`,
    },
  ];

  return (
    <aside
      aria-label="Duel side panel"
      className="flex min-h-0 flex-col gap-3 rounded-2xl border border-accent/15 bg-surface/60 p-3 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)] lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)]"
    >
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={options}
        ariaLabel="Switch between the phase reference and the duel log"
        className="w-full"
      />

      <CurrentPhaseCard />

      <div
        role="tabpanel"
        id={`sidepanel-panel-${tab}`}
        aria-labelledby={`sidepanel-tab-${tab}`}
        tabIndex={0}
        className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {tab === "actions" ? <PhaseReference /> : <DuelLog />}
      </div>
    </aside>
  );
}
