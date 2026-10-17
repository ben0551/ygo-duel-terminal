import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button primitives, shadcn/ui style: a cva variant map plus an `asChild`
 * escape hatch so any element can borrow the styling.
 *
 * Every size is at least 36px tall and the default is 44px, which keeps the
 * controls comfortable to hit during a duel on a phone.
 */
const buttonVariants = cva(
  [
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl",
    "font-semibold uppercase tracking-wider",
    "transition-[background-color,border-color,box-shadow,color,transform] duration-150",
    "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border border-white/10 bg-white/5 text-ink hover:border-accent/50 hover:bg-accent/15 hover:shadow-[0_0_18px_-4px_var(--color-accent)]",
        primary:
          "border border-accent/50 bg-gradient-to-br from-accent/25 to-accent-2/25 text-white hover:shadow-[0_0_24px_-4px_var(--color-accent)]",
        outline:
          "border border-accent/35 bg-transparent text-accent hover:bg-accent/12 hover:shadow-[0_0_18px_-6px_var(--color-accent)]",
        ghost:
          "border border-transparent bg-transparent text-muted hover:bg-white/8 hover:text-ink",
        danger:
          "border border-danger/45 bg-danger/10 text-[#FF8AA0] hover:bg-danger/20 hover:text-white hover:shadow-[0_0_20px_-6px_var(--color-danger)]",
        success:
          "border border-success/35 bg-success/8 text-[#7BF3B4] hover:bg-success/18 hover:text-white hover:shadow-[0_0_18px_-6px_var(--color-success)]",
      },
      size: {
        sm: "h-9 px-3 text-[11px]",
        default: "h-11 px-4 text-[13px]",
        lg: "h-12 px-5 text-sm",
        icon: "h-11 w-11 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      // Default to type="button" so buttons inside forms never submit by accident.
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
