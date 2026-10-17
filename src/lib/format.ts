/** Number and time formatting helpers shared across the UI. */

/** Thousands-separated LP, e.g. 8000 -> "8,000". */
export function formatLP(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/** Signed LP delta, e.g. -500 -> "-500" using a real minus glyph. */
export function formatDelta(delta: number): string {
  const sign = delta < 0 ? "\u2212" : "+";
  return `${sign}${formatLP(Math.abs(delta))}`;
}

/**
 * 24-hour clock stamp for log rows. Uses `en-GB` so the output is stable
 * across locales and never depends on the host's 12/24-hour preference.
 */
export function formatLogTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Timestamp used in exported log filenames: 2026-10-17-05-24-31 */
export function fileTimestamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

/** Clamp an arbitrary number into `[min, max]`, rounding to an integer. */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
