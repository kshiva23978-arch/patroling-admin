// Mirrors Ranges::CATEGORIES in backend/app/Models/Ranges.php — keep in sync.
export const RANGE_CATEGORIES = [
  "HQ Range",
  "Protection Range",
  "LBWS",
  "MPNP",
  "MGMNP",
  "Research & Survey",
] as const;

export type RangeCategory = (typeof RANGE_CATEGORIES)[number];
