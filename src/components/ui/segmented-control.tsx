"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  /** Optional trailing content, e.g. a count. */
  badge?: React.ReactNode;
  /**
   * Overrides the accessible name. Needed whenever `badge` is set, otherwise
   * the visible text and the badge concatenate ("Log7") instead of reading as
   * a phrase.
   */
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  /** Accessible name for the tab list. */
  ariaLabel: string;
  className?: string;
}

/**
 * A two-or-more-way toggle rendered as a real ARIA tab list.
 *
 * Implements the roving tabindex pattern: only the selected tab is in the tab
 * order, and Left/Right/Home/End move between options — matching how native
 * tab widgets behave for keyboard and screen-reader users.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const refs = React.useRef(new Map<T, HTMLButtonElement>());

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const lastIndex = options.length - 1;
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = index === lastIndex ? 0 : index + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = index === 0 ? lastIndex : index - 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    event.preventDefault();
    const next = options[nextIndex];
    onChange(next.value);
    refs.current.get(next.value)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-white/8 bg-black/30 p-1",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              // Block body: React 19 treats a returned value as a cleanup fn.
              if (element) refs.current.set(option.value, element);
              else refs.current.delete(option.value);
            }}
            type="button"
            role="tab"
            id={`sidepanel-tab-${option.value}`}
            aria-selected={selected}
            aria-controls={`sidepanel-panel-${option.value}`}
            aria-label={option.ariaLabel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2",
              "text-[11px] font-bold uppercase tracking-[0.14em]",
              "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
              selected
                ? "bg-gradient-to-br from-accent/30 to-accent-2/25 text-white shadow-[0_0_16px_-6px_var(--color-accent)]"
                : "text-muted hover:bg-white/6 hover:text-ink",
            )}
          >
            {option.icon}
            {option.label}
            {option.badge !== undefined && (
              <span className="font-mono text-[10px] font-semibold opacity-70">
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
