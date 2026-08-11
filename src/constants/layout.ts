/** Shared horizontal spacing for full-screen content. */
export function getHorizontalPadding(width: number): number {
  if (width >= 1200) return 150;
  if (width >= 900) return 50;
  if (width >= 600) return 30;
  return 5;
}
