import type { PatrolReportEntry } from "@/lib/resources/patrollings";
import { trailColorFor } from "./trailColors";

const TILE_SIZE = 256;
const MAX_ZOOM = 16;
const MIN_ZOOM = 3;
/** Same 10-minute rule as the on-screen maps — a sync gap draws as a break. */
const TRAIL_GAP_THRESHOLD_MS = 10 * 60 * 1000;

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

/** Web-Mercator world pixel coordinates at [zoom]. */
function project(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function loadTile(zoom: number, x: number, y: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    // OSM serves tiles with `Access-Control-Allow-Origin: *`, so drawing
    // them into a canvas doesn't taint it — required for `toDataURL`.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    const sub = "abc"[(x + y) % 3];
    img.src = `https://${sub}.tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  });
}

function splitByGap(points: PatrolReportEntry["route_points"]): PatrolReportEntry["route_points"][] {
  const segments: PatrolReportEntry["route_points"][] = [];
  let current: PatrolReportEntry["route_points"] = [];
  let previousAt: number | null = null;
  for (const point of points) {
    const at = new Date(point.recorded_at).getTime();
    if (previousAt !== null && at - previousAt > TRAIL_GAP_THRESHOLD_MS && current.length > 0) {
      segments.push(current);
      current = [];
    }
    current.push(point);
    previousAt = at;
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

export interface ReportMapImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Draws every patrol's trail over OSM basemap tiles onto an offscreen
 * canvas of [width]×[height] px and returns it as a PNG data URL for the
 * PDF — same colours, A/B endpoints and incident/case flags as the
 * on-screen `ReportMap`, but rendered at a fixed print size independent
 * of the viewer's window, and without the cross-origin/DOM-screenshot
 * fragility of rasterising the live Leaflet map.
 *
 * Zoom is the largest level (≤ [MAX_ZOOM]) at which every trail fits in
 * the frame with a margin. Returns `null` when there is nothing to draw
 * (no trail, or the browser can't produce a canvas).
 */
export async function renderReportMapImage(
  entries: PatrolReportEntry[],
  { width = 1600, height = 1000 }: { width?: number; height?: number } = {},
): Promise<ReportMapImage | null> {
  const coords: { lat: number; lng: number }[] = [];
  for (const entry of entries) {
    for (const p of entry.route_points) coords.push({ lat: p.latitude, lng: p.longitude });
    for (const i of entry.incidents) {
      if (i.location.latitude !== null && i.location.longitude !== null) coords.push({ lat: i.location.latitude, lng: i.location.longitude });
    }
    for (const c of entry.case_reports) {
      if (c.location.latitude !== null && c.location.longitude !== null) coords.push({ lat: c.location.latitude, lng: c.location.longitude });
    }
  }
  if (coords.length === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // --- Choose zoom + centre so all coordinates fit with a margin ---
  const margin = 60;
  const minLat = Math.min(...coords.map((c) => c.lat));
  const maxLat = Math.max(...coords.map((c) => c.lat));
  const minLng = Math.min(...coords.map((c) => c.lng));
  const maxLng = Math.max(...coords.map((c) => c.lng));
  let zoom = MAX_ZOOM;
  for (; zoom > MIN_ZOOM; zoom--) {
    const a = project(maxLat, minLng, zoom);
    const b = project(minLat, maxLng, zoom);
    if (b.x - a.x <= width - 2 * margin && b.y - a.y <= height - 2 * margin) break;
  }
  const centre = coords.length ? { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 } : INDIA_CENTER;
  const centrePx = project(centre.lat, centre.lng, zoom);
  const originX = centrePx.x - width / 2;
  const originY = centrePx.y - height / 2;
  const toCanvas = (lat: number, lng: number) => {
    const p = project(lat, lng, zoom);
    return { x: p.x - originX, y: p.y - originY };
  };

  // --- Basemap tiles ---
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(0, 0, width, height);
  const maxTile = 2 ** zoom - 1;
  const tx0 = Math.floor(originX / TILE_SIZE);
  const ty0 = Math.floor(originY / TILE_SIZE);
  const tx1 = Math.floor((originX + width) / TILE_SIZE);
  const ty1 = Math.floor((originY + height) / TILE_SIZE);
  const tileJobs: Promise<void>[] = [];
  for (let tx = tx0; tx <= tx1; tx++) {
    for (let ty = ty0; ty <= ty1; ty++) {
      if (ty < 0 || ty > maxTile) continue;
      const wrappedX = ((tx % (maxTile + 1)) + maxTile + 1) % (maxTile + 1);
      tileJobs.push(
        loadTile(zoom, wrappedX, ty).then((img) => {
          if (img) ctx.drawImage(img, tx * TILE_SIZE - originX, ty * TILE_SIZE - originY, TILE_SIZE, TILE_SIZE);
        }),
      );
    }
  }
  await Promise.all(tileJobs);

  // --- Trails ---
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  entries.forEach((entry, index) => {
    const color = trailColorFor(index);
    for (const segment of splitByGap(entry.route_points)) {
      if (segment.length < 2) continue;
      const path = new Path2D();
      segment.forEach((p, i) => {
        const { x, y } = toCanvas(p.latitude, p.longitude);
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      });
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 8;
      ctx.stroke(path);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4.5;
      ctx.stroke(path);
    }
  });

  // --- Endpoints (A/B) and flags, drawn after every trail so they sit on top ---
  const drawEndpoint = (lat: number, lng: number, label: string, color: string) => {
    const { x, y } = toCanvas(lat, lng);
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y + 0.5);
  };
  const drawFlag = (lat: number, lng: number, color: string) => {
    const { x, y } = toCanvas(lat, lng);
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 1, y - 21);
    ctx.lineTo(x + 15, y - 21);
    ctx.lineTo(x + 11, y - 16);
    ctx.lineTo(x + 15, y - 11);
    ctx.lineTo(x + 1, y - 11);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  entries.forEach((entry, index) => {
    const color = trailColorFor(index);
    const first = entry.route_points[0];
    const last = entry.route_points.at(-1);
    if (first) drawEndpoint(first.latitude, first.longitude, "A", color);
    if (last && last !== first) drawEndpoint(last.latitude, last.longitude, "B", color);
  });
  for (const entry of entries) {
    for (const i of entry.incidents) {
      if (i.location.latitude !== null && i.location.longitude !== null) drawFlag(i.location.latitude, i.location.longitude, "#eab308");
    }
    for (const c of entry.case_reports) {
      if (c.location.latitude !== null && c.location.longitude !== null) drawFlag(c.location.latitude, c.location.longitude, "#dc2626");
    }
  }

  // --- Attribution (required by OSM's tile usage policy) ---
  const attribution = "© OpenStreetMap contributors";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  const textWidth = ctx.measureText(attribution).width;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(width - textWidth - 12, height - 20, textWidth + 12, 20);
  ctx.fillStyle = "#3f3f46";
  ctx.fillText(attribution, width - 6, height - 4);

  return { dataUrl: canvas.toDataURL("image/png"), width, height };
}
