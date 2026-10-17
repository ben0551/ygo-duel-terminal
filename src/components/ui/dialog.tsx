"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

/**
 * Modal dialog built on Radix.
 *
 * Radix gives us the parts that are genuinely hard to get right: focus trap,
 * focus restore, Escape to close, `aria-modal`, and inert background content.
 * We only supply the styling and the animation.
 */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-[#03060E]/80 backdrop-blur-md",
          // No exit animation on purpose: Radix unmounts a closing layer only
          // after `animationend`, and if that never fires the overlay stays in
          // the DOM at full opacity and silently swallows every click.
          "data-[state=open]:animate-[fade-in_180ms_ease-out]",
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
          "rounded-2xl border border-accent/35 bg-surface/95 p-5 backdrop-blur-2xl",
          "shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)]",
          "focus:outline-none",
          "data-[state=open]:animate-[dialog-in_220ms_cubic-bezier(0.2,0.9,0.3,1.2)]",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
