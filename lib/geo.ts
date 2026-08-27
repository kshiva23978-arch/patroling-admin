export interface LatLng {
  lat: number;
  lng: number;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Running total distance (km) covered up to and including each point —
 * computed from the raw GPS trail itself, so it stays meaningful while a
 * patrol is still in progress (the odometer-based `total_distance` on the
 * entry is only ever set once the patrol ends).
 */
export function cumulativeDistancesKm(points: LatLng[]): number[] {
  const result: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) total += haversineKm(points[i - 1], points[i]);
    result.push(total);
  }
  return result;
}

/**
 * Projects lat/lng points onto a local flat plane (km from the trail's
 * centroid) using an equirectangular approximation. Accurate enough for the
 * few-km scale of a single patrol route; not meant for anything spanning a
 * large fraction of the globe.
 */
function toPlanarKm(points: LatLng[]): { x: number; y: number }[] {
  const R = 6371;
  const lat0 = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng0 = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  const lat0Rad = (lat0 * Math.PI) / 180;
  return points.map((p) => ({
    x: R * ((p.lng - lng0) * Math.PI) / 180 * Math.cos(lat0Rad),
    y: R * ((p.lat - lat0) * Math.PI) / 180,
  }));
}

/** Monotone-chain convex hull over planar points, returned counter-clockwise. */
function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: { x: number; y: number }[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: { x: number; y: number }[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

/** Shoelace formula for a simple polygon's area (km², given vertices in km). */
function polygonAreaKm2(polygon: { x: number; y: number }[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/**
 * Area (km²) of the convex hull wrapping the entire GPS trail — the total
 * ground the patrol's movements spanned, regardless of how much of it was
 * actually walked/driven through vs. just enclosed.
 */
export function areaCoveredKm2(points: LatLng[]): number {
  if (points.length < 3) return 0;
  const hull = convexHull(toPlanarKm(points));
  if (hull.length < 3) return 0;
  return polygonAreaKm2(hull);
}

/**
 * Area (km²) of the ground strip actually observed while moving along the
 * trail — path length × a fixed visibility swath on either side of the
 * route — as opposed to `areaCoveredKm2`'s enclosing footprint.
 */
export function areaPatrolledKm2(points: LatLng[], swathWidthKm: number): number {
  const pathLengthKm = cumulativeDistancesKm(points).at(-1) ?? 0;
  return pathLengthKm * swathWidthKm;
}
