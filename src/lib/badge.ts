/**
 * Update the PWA app badge with the number of uncompleted tactics for today.
 * Uses the Badging API — only works when installed as PWA. Silently no-ops otherwise.
 */
export function updateAppBadge(uncompleted: number): void {
  if (!('setAppBadge' in navigator)) return;
  try {
    if (uncompleted > 0) {
      (navigator as unknown as { setAppBadge: (n: number) => Promise<void> }).setAppBadge(uncompleted);
    } else {
      (navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge();
    }
  } catch {
    // Silently ignore — badge API may not be available
  }
}
