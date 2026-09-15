/**
 * Distinct, print-safe trail colours shared by the on-screen map, the
 * table swatches and the PDF — kept Leaflet-free so server-rendered
 * components can import it without dragging `leaflet` (which touches
 * `window` at import time) into SSR. Cycles once there are more patrols
 * than entries here.
 */
const TRAIL_PALETTE = [
  "#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#ea580c", "#4f46e5",
  "#0d9488", "#b91c1c", "#9333ea", "#ca8a04", "#1d4ed8",
];

export function trailColorFor(index: number): string {
  return TRAIL_PALETTE[index % TRAIL_PALETTE.length];
}
