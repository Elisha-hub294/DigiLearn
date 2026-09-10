/** Shared horizontal spacing for full-screen content. */
export function getHorizontalPadding(width: number): number {
  if (width >= 1200) return 150;
  if (width >= 900) return 50;
  if (width >= 600) return 30;
  return 5;
}

/** Width available to tab content after the desktop navigation rail. */
export function getTabContentWidth(width: number): number {
  return width >= 768 ? Math.max(0, width - 220) : width;
}
