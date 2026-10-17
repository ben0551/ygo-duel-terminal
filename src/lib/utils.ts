import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and de-duplicate conflicting Tailwind
 * utilities (so a `className` prop passed by a parent wins over a default).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
