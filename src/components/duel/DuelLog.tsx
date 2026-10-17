"use client";

import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDuel } from "@/hooks/useDuel";
import { buildLogExport } from "@/lib/duel";
import { fileTimestamp, formatLogTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LogKind } from "@/types/duel";

/** Left-border colour per entry kind, so the log is scannable at a glance. */
const KIND_STYLES: Record<LogKind, string> = {
  "lp-up": "border-l-success",
  "lp-down": "border-l-danger",
  turn: "border-l-accent",
  phase: "border-l-[#6EE7FF]",
  roll: "border-l-accent-2",
  flip: "border-l-[#F5C24B]",
  win: "border-l-[#F5C24B] bg-[#F5C24B]/10",
  system: "border-l-white/25",
};

export function DuelLog() {
  const { state, dispatch } = useDuel();

  const handleExport = () => {
    if (state.log.length === 0) return;
    const blob = new Blob([buildLogExport(state)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `duel-log-${fileTimestamp()}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Revoke on the next tick so Safari has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
          Duel Log
          <span className="ml-1.5 font-mono text-[10px] font-semibold text-muted">
            ({state.log.length})
          </span>
        </h3>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            disabled={state.log.length === 0}
            onClick={handleExport}
          >
            <Download aria-hidden="true" className="size-3.5" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={state.log.length === 0}
            onClick={() => dispatch({ type: "CLEAR_LOG" })}
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {state.log.length === 0 ? (
        <p className="flex-1 place-content-center py-8 text-center text-xs italic text-muted">
          No actions recorded yet.
          <br />
          Adjust LP, advance phases, or roll dice to begin.
        </p>
      ) : (
        <ol
          aria-label="Duel log entries, newest first"
          className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 [scrollbar-color:var(--color-accent)_transparent] [scrollbar-width:thin]"
        >
          {state.log.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border-l-2 bg-white/4 px-2.5 py-2",
                "animate-[log-in_280ms_ease-out] motion-reduce:animate-none",
                KIND_STYLES[entry.kind],
              )}
            >
              <time
                dateTime={new Date(entry.at).toISOString()}
                className="shrink-0 pt-px font-mono text-[10px] text-muted"
              >
                {formatLogTime(entry.at)}
              </time>
              <span className="min-w-0 flex-1 break-words text-[12.5px] leading-snug text-ink">
                {entry.text}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
