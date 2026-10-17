import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-white/10 bg-black/35 px-3",
        "font-mono text-[15px] font-semibold text-ink placeholder:font-sans placeholder:text-xs placeholder:font-medium placeholder:text-muted/70",
        "outline-none transition-colors",
        "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Hide the number spinners; the custom +/- controls replace them.
        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "text-[10px] font-bold uppercase tracking-[0.18em] text-muted",
        className,
      )}
      {...props}
    />
  );
}
