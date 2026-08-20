export interface LatLng {
  lat: number;
  lng: number;
}

function haversineKm(a: LatLng, b: LatLng): number {
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
