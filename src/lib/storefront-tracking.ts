/** Tracking is best-effort and must never interfere with a purchase link. */
export function trackStorefrontEvent(tracker: unknown, ...args: unknown[]): void {
  if (typeof tracker !== "function") return;
  try {
    tracker(...args);
  } catch {
    // External pixels may fail or be blocked; navigation must remain available.
  }
}