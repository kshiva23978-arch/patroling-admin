"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PatrolCaseRef, PatrolIncidentRef, PatrolRoutePoint } from "@/lib/resources/patrollings";

type MarkerKind = "walking" | "car" | "motorcycle" | "boat" | "unknown";

function markerKindFor(point: PatrolRoutePoint): MarkerKind {
  if (point.travel_mode === "walking") return "walking";
  if (point.vehicle_type === "boat") return "boat";
  if (point.vehicle_type === "4_wheeler") return "car";
  if (point.vehicle_type === "2_wheeler") return "motorcycle";
  return "unknown";
}

// --- Road snapping (OSRM) ---------------------------------------------
//
// Only vehicle runs are snapped to roads. Walking runs are left as the raw
// GPS points: rangers patrol on foot through forest/off-trail terrain as
// often as along any road, and — verified directly against this server —
// its "foot" profile silently returns the exact same route as "driving"
// (no separate pedestrian/trail network is actually loaded), so snapping a
// walking run to it would just misrepresent an off-road patrol as having
// followed a nearby road. Boat runs have no road network to snap to either.
//
// This calls the public OSRM demo server (router.project-osrm.org), free
// and keyless but rate-limited to 1 request/second and scoped to
// "reasonable, non-commercial use" — see
// https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server. The
// throttle below serializes every request (across every mounted map) to
// stay under that. For heavier production use, self-host an OSRM instance
// and point OSRM_BASE_URL at it instead.
const OSRM_BASE_URL = "https://router.project-osrm.org";
const OSRM_MIN_INTERVAL_MS = 1100;

let osrmGate: Promise<void> = Promise.resolve();

function throttledFetch(url: string): Promise<Response> {
  const run = osrmGate.then(() => fetch(url));
  const wait = () => new Promise<void>((resolve) => setTimeout(resolve, OSRM_MIN_INTERVAL_MS));
  osrmGate = run.then(wait, wait);
  return run;
}

// A gap this long between two consecutive recorded points is treated as
// "still catching up on an offline backlog" rather than normal travel — the
// trail breaks here instead of drawing a straight (or road-snapped) line
// across however far the ranger travelled while offline. Once the missing
// in-between points sync in, they land between the two on the next fetch
// and the segments merge back into one on their own — nothing here tracks
// or reconciles segments explicitly. Matches the Flutter app's own trail
// view (`patrol_map_tab.dart`'s `_trailGapThreshold`).
const TRAIL_GAP_THRESHOLD_MS = 10 * 60 * 1000;

/** Splits the trail into runs with no unusually large time gap between
 * consecutive points, so each run can be drawn as its own polyline. */
function splitByGap(points: PatrolRoutePoint[]): PatrolRoutePoint[][] {
  const segments: PatrolRoutePoint[][] = [];
  let current: PatrolRoutePoint[] = [];

  for (const point of points) {
    const previous = current.at(-1);
    if (previous) {
      const gap = new Date(point.recorded_at).getTime() - new Date(previous.recorded_at).getTime();
      if (gap > TRAIL_GAP_THRESHOLD_MS) {
        segments.push(current);
        current = [];
      }
    }
    current.push(point);
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

function osrmModeFor(point: PatrolRoutePoint): "driving" | null {
  const kind = markerKindFor(point);
  return kind === "car" || kind === "motorcycle" ? "driving" : null;
}

type ModeGroup = { mode: "driving" | null; points: PatrolRoutePoint[] };

/** Splits the trail into runs of consecutive points sharing the same
 * snapping mode, so each run can be snapped to roads as one path. */
function groupByMode(points: PatrolRoutePoint[]): ModeGroup[] {
  const groups: ModeGroup[] = [];
  for (const point of points) {
    const mode = osrmModeFor(point);
    const current = groups.at(-1);
    if (current && current.mode === mode) {
      current.points.push(point);
    } else {
      groups.push({ mode, points: [point] });
    }
  }
  return groups;
}

// Kept well under OSRM's practical limits (and the URL length a GET request
// can carry), and short enough to stay a light, quick request even on the
// shared public server.
const MAX_POINTS_PER_REQUEST = 100;

/**
 * Snaps each point in a vehicle run to its own nearest road, independently —
 * rather than asking OSRM to route *through* every point in order. A routed
 * path can loop across the local road graph well beyond the ground actually
 * covered whenever the raw points sit near sparse/incomplete road coverage
 * (rural forest patrol areas) or are clustered close together (the ranger
 * idling in one spot), drawing a trail the ranger never walked/drove.
 * Snapping each point on its own sidesteps that failure mode entirely: the
 * worst case is a point landing on the nearest real road, not a detour
 * through the wrong one. The resulting points are then connected by straight
 * legs (see [buildLegs]), same as any unsnapped run.
 *
 * One `/route/v1` call per chunk still snaps every point in it in a single
 * request — its `waypoints` array carries one snapped location per input
 * coordinate regardless of whether a route between them was found — so this
 * costs the same one-request-per-chunk as routing would.
 */
async function snapPointsToRoads(points: PatrolRoutePoint[]): Promise<L.LatLngTuple[]> {
  const result: L.LatLngTuple[] = [];

  for (let start = 0; start < points.length; start += MAX_POINTS_PER_REQUEST) {
    const chunk = points.slice(start, start + MAX_POINTS_PER_REQUEST);
    const coordinates = chunk.map((p) => `${p.longitude},${p.latitude}`).join(";");

    try {
      const response = await throttledFetch(`${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=false`);
      const data = await response.json();
      const waypoints: { location: [number, number] }[] | undefined = data?.waypoints;
      if (!waypoints || waypoints.length !== chunk.length) throw new Error("Unexpected waypoints.");

      chunk.forEach((p, i) => {
        const loc = waypoints[i]?.location;
        result.push(loc ? [loc[1], loc[0]] : [p.latitude, p.longitude]);
      });
    } catch {
      // No nearby road (or the request failed) — fall back to the raw point.
      chunk.forEach((p) => result.push([p.latitude, p.longitude]));
    }
  }

  return result;
}

/**
 * Resolves each point in the trail to the lat/lng it should be drawn at:
 * road-snapped for vehicle runs, raw for everything else (see the module
 * doc comment above for why walking/boat runs are left unsnapped). Output is
 * one coordinate per input point, in order. `cache` holds resolved runs
 * keyed by their position in the trail so that, as new points arrive, only
 * the still-growing final run is re-requested — closed runs earlier in the
 * trail are never re-fetched. `keyPrefix` scopes those cache keys to one
 * gap-free trail segment (see [splitByGap]) so two different segments never
 * collide on the same relative position/length.
 */
async function buildDisplayPoints(
  points: PatrolRoutePoint[],
  cache: Map<string, L.LatLngTuple[]>,
  keyPrefix: string,
): Promise<L.LatLngTuple[]> {
  const groups = groupByMode(points);
  const result: L.LatLngTuple[] = [];
  let index = 0;

  for (const group of groups) {
    const key = `${keyPrefix}:${group.mode ?? "raw"}:${index}:${group.points.length}`;
    index += group.points.length;

    let resolved = cache.get(key);
    if (!resolved) {
      resolved = group.mode
        ? await snapPointsToRoads(group.points)
        : group.points.map((p): L.LatLngTuple => [p.latitude, p.longitude]);
      if (group !== groups.at(-1)) cache.set(key, resolved);
    }
    result.push(...resolved);
  }

  return result;
}

// A leg lasting this long or longer is drawn at the darkest end of the trail
// color scale — the ranger dwelling in one place, as opposed to passing
// through it. Kept below `TRAIL_GAP_THRESHOLD_MS` so every leg that's part of
// a trail (rather than a sync-backlog break) still falls somewhere on the
// scale rather than saturating it.
const MAX_DWELL_SECONDS_FOR_COLOR = 5 * 60;

const TRAIL_COLOR_LIGHT = { r: 0xfb, g: 0xbc, b: 0x04 }; // passing through — the route's usual yellow
const TRAIL_COLOR_DARK = { r: 0x7c, g: 0x2d, b: 0x12 }; // dwelling in place

function legColor(durationSeconds: number): { line: string; casing: string } {
  const t = Math.max(0, Math.min(1, durationSeconds / MAX_DWELL_SECONDS_FOR_COLOR));
  const r = Math.round(TRAIL_COLOR_LIGHT.r + (TRAIL_COLOR_DARK.r - TRAIL_COLOR_LIGHT.r) * t);
  const g = Math.round(TRAIL_COLOR_LIGHT.g + (TRAIL_COLOR_DARK.g - TRAIL_COLOR_LIGHT.g) * t);
  const b = Math.round(TRAIL_COLOR_LIGHT.b + (TRAIL_COLOR_DARK.b - TRAIL_COLOR_LIGHT.b) * t);
  return {
    line: `rgb(${r},${g},${b})`,
    casing: `rgb(${Math.round(r * 0.45)},${Math.round(g * 0.45)},${Math.round(b * 0.45)})`,
  };
}

function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  if (whole < 60) return `${whole}s`;
  const totalMinutes = Math.round(whole / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// Includes seconds — consecutive pings usually land under a minute apart, so
// hour:minute alone would show the same clock time for both ends of a leg.
// See `formatDateTime` below for why `timeZone` must be explicit here.
function formatClockTime(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

function haversineMeters(a: L.LatLngTuple, b: L.LatLngTuple): number {
  const R = 6371000;
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Ground speed over a leg from its actual recorded coordinates — not the
 * road-snapped display coordinates, so a snap nudging a point onto a nearby
 * road doesn't skew the reported speed. */
function legSpeedKmh(from: PatrolRoutePoint, to: PatrolRoutePoint, durationSeconds: number): number | null {
  if (durationSeconds <= 0) return null;
  const meters = haversineMeters([from.latitude, from.longitude], [to.latitude, to.longitude]);
  return (meters / durationSeconds) * 3.6;
}

function legTooltip(
  kind: MarkerKind,
  from: PatrolRoutePoint,
  to: PatrolRoutePoint,
  durationSeconds: number,
): string {
  const speed = legSpeedKmh(from, to, durationSeconds);
  const speedLabel = speed === null ? "stationary" : `${speed.toFixed(1)} km/h`;
  return `${modeLabelFor(kind)} · ${speedLabel} · ${formatDuration(durationSeconds)} spent · ${formatClockTime(from.recorded_at)} → ${formatClockTime(to.recorded_at)}`;
}

function modeLabelFor(kind: MarkerKind): string {
  switch (kind) {
    case "walking":
      return "Walking";
    case "boat":
      return "Boat";
    case "car":
      return "4-Wheeler";
    case "motorcycle":
      return "2-Wheeler";
    default:
      // Genuinely possible mid-patrol: the ranger toggled a travel mode off
      // (in the app's "Currently Traveling" switches) without picking a new
      // one before the next ping fired.
      return "Mode not set";
  }
}

/** Small white glyph for a travel-mode change marker's badge circle. */
function modeGlyphMarkup(kind: MarkerKind): string {
  switch (kind) {
    case "walking":
      return `
        <circle cx="12" cy="6" r="2" fill="white"/>
        <g stroke="white" stroke-width="2" stroke-linecap="round" fill="none">
          <line x1="12" y1="8" x2="12" y2="14"/>
          <line x1="12" y1="14" x2="9" y2="19"/>
          <line x1="12" y1="14" x2="15" y2="19"/>
          <line x1="12" y1="10" x2="8" y2="13"/>
          <line x1="12" y1="10" x2="16" y2="9"/>
        </g>`;
    case "car":
      return `
        <path fill="white" d="M4 15l1.5-4.5A2 2 0 0 1 7.4 9h9.2a2 2 0 0 1 1.9 1.5L20 15v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-.5H7v.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3z"/>
        <circle cx="7.5" cy="17.5" r="1.4" fill="#0f172a"/>
        <circle cx="16.5" cy="17.5" r="1.4" fill="#0f172a"/>`;
    case "boat":
      return `
        <path fill="white" d="M4 15h16l-1 3a2 2 0 0 1-1.9 1.4H6.9A2 2 0 0 1 5 18l-1-3z"/>
        <line x1="12" y1="4" x2="12" y2="15" stroke="white" stroke-width="1.5"/>
        <path fill="white" opacity="0.85" d="M12 5.5l4.5 8.5H12V5.5z"/>`;
    case "motorcycle":
      return `
        <g stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <circle cx="7" cy="16" r="2.6"/>
          <circle cx="17" cy="16" r="2.6"/>
          <path d="M7 16l4-6h4l2 6"/>
          <path d="M11 10h3.5"/>
        </g>`;
    default:
      return `<circle cx="12" cy="12" r="3" fill="white"/>`;
  }
}

/** A small badge marking where the ranger's travel mode changed along the trail. */
function buildModeChangeIcon(kind: MarkerKind): L.DivIcon {
  const size = 26;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
    <circle cx="12" cy="12" r="11" fill="#2563eb" stroke="white" stroke-width="2"/>
    ${modeGlyphMarkup(kind)}
  </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** A pin-style flag: pole planted at the point, flag pennant near the top. */
function buildFlagIcon(color: string): L.DivIcon {
  const size = 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
    <line x1="5" y1="21" x2="5" y2="3" stroke="white" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="5" y1="21" x2="5" y2="3" stroke="#27272a" stroke-width="1.75" stroke-linecap="round"/>
    <path d="M5 4h14l-4 4 4 4H5z" fill="${color}" stroke="white" stroke-width="1" stroke-linejoin="round"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [6, size - 3],
  });
}

/** A Google Maps-style teardrop pin with a letter label, for the trail's start/end points. */
function buildEndpointIcon(label: string, color: string): L.DivIcon {
  const size = 34;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="${size}" height="${(size * 32) / 24}">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="7" fill="white"/>
    <text x="12" y="16.5" text-anchor="middle" font-size="11" font-weight="700" font-family="ui-sans-serif,system-ui,sans-serif" fill="${color}">${label}</text>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, (size * 32) / 24],
    iconAnchor: [size / 2, (size * 32) / 24],
  });
}

// Fixed to the app's own operating timezone rather than the viewing
// device's — see `PatrolDetails.tsx`'s matching `formatDateTime` for why.
const APP_TIME_ZONE = "Asia/Kolkata";

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIME_ZONE,
  });
}

function photoStripHtml(photos: { id: string }[], baseUrl: string): string {
  if (photos.length === 0) {
    return '<div style="margin-top:8px;font-size:11.5px;color:#a1a1aa;">No photos</div>';
  }
  const thumbs = photos
    .map(
      (p) =>
        `<img src="${baseUrl}/${p.id}" style="width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #e4e4e7;" />`,
    )
    .join("");
  return `<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">${thumbs}</div>`;
}

function buildIncidentInfoContent(incident: PatrolIncidentRef, mediaBaseUrl: string): string {
  return `
    <div style="min-width:220px;max-width:270px;padding:2px 2px 4px;font-family:ui-sans-serif,system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <span style="display:inline-block;width:9px;height:9px;border-radius:9999px;background:#eab308;"></span>
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:#a16207;">Incident</span>
      </div>
      <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px;">${escapeHtml(incident.name)}</div>
      <div style="font-size:12px;color:#3f3f46;margin-bottom:6px;">${escapeHtml(incident.details)}</div>
      <div style="font-size:11px;color:#71717a;">${formatDateTime(incident.reported_at)}</div>
      ${photoStripHtml(incident.photos, mediaBaseUrl)}
    </div>
  `;
}

function buildCaseInfoContent(caseReport: PatrolCaseRef, mediaBaseUrl: string): string {
  const rescueLabel =
    caseReport.rescue_conducted === null ? "—" : caseReport.rescue_conducted ? "Yes" : "No";

  return `
    <div style="min-width:230px;max-width:280px;padding:2px 2px 4px;font-family:ui-sans-serif,system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <span style="display:inline-block;width:9px;height:9px;border-radius:9999px;background:#dc2626;"></span>
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:#b91c1c;">Case ${escapeHtml(caseReport.case_number)}</span>
      </div>
      <div style="font-size:12.5px;font-weight:600;color:#0f172a;margin-bottom:4px;">${escapeHtml(caseReport.conflict_type ?? "Unspecified")}</div>
      <div style="font-size:12px;color:#3f3f46;margin-bottom:8px;">${escapeHtml(caseReport.details)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;row-gap:8px;column-gap:16px;">
        ${statBlock("Rescue", rescueLabel)}
        ${statBlock("Reported", formatDateTime(caseReport.reported_at))}
      </div>
      ${photoStripHtml(caseReport.photos, mediaBaseUrl)}
    </div>
  `;
}

function statBlock(label: string, value: string): string {
  return `<div>
    <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.03em;color:#a1a1aa;">${label}</div>
    <div style="font-size:13px;font-weight:600;color:#18181b;">${value}</div>
  </div>`;
}

const DEFAULT_CENTER: L.LatLngTuple = [20.5937, 78.9629]; // India, used when there's no GPS trail yet.

/**
 * Renders a patrol's GPS trail as a Google Maps-style route — vehicle runs
 * snapped point-by-point to their nearest road via OSRM, walking/boat runs
 * left as the raw recorded points (a ping every ~30s while the patrol is
 * active) — with each leg between consecutive points colored by how long the
 * ranger spent on it (darker = more time spent) and a hover tooltip giving
 * its travel mode, duration, and time range. Also marked, wherever the
 * ranger's travel mode actually changed (walking ↔ a vehicle, or between
 * vehicle types): a small blue badge (hover for the mode switched to and
 * when).
 *
 * Incidents and cases are plotted as flags (yellow/red) wherever they carry
 * a location — click one to see its full details, including photos.
 */
export function LiveMap({
  points,
  incidents,
  caseReports,
  incidentMediaBaseUrl = "/api/incident-media",
  caseMediaBaseUrl = "/api/case-media",
}: {
  points: PatrolRoutePoint[];
  incidents: PatrolIncidentRef[];
  caseReports: PatrolCaseRef[];
  /** Where an incident flag's photo strip resolves photo ids against — defaults to the Patrol module's proxy route. */
  incidentMediaBaseUrl?: string;
  /** Where a case flag's photo strip resolves photo ids against — defaults to the Patrol module's proxy route. */
  caseMediaBaseUrl?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // One casing+line pair per leg (each pair of consecutive recorded points)
  // — rebuilt whenever the trail changes so a sync gap shows as a visible
  // break rather than one continuous line jumping across it, and so each leg
  // can carry its own dwell-time color and hover tooltip.
  const legLinesRef = useRef<{ casing: L.Polyline; line: L.Polyline }[]>([]);
  const displayPointCacheRef = useRef<Map<string, L.LatLngTuple[]>>(new Map());
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const modeChangeMarkersRef = useRef<L.Marker[]>([]);
  const flagMarkersRef = useRef<L.Marker[]>([]);
  const [ready, setReady] = useState(false);

  // Mount the map exactly once. Guards against React StrictMode's dev-mode
  // double-invoke (which would otherwise try to initialize Leaflet twice on
  // the same DOM node and throw) by tearing the map fully down on cleanup.
  useEffect(() => {
    if (!containerRef.current) return;

    const last = points.at(-1);
    const center: L.LatLngTuple = last ? [last.latitude, last.longitude] : DEFAULT_CENTER;

    const map = L.map(containerRef.current).setView(center, last ? 15 : 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      legLinesRef.current = [];
      startMarkerRef.current = null;
      endMarkerRef.current = null;
      modeChangeMarkersRef.current = [];
      setReady(false);
    };
    // Only mount once — path updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    let cancelled = false;
    const segments = splitByGap(points);
    Promise.all(
      segments.map((segment, i) => buildDisplayPoints(segment, displayPointCacheRef.current, `seg${i}`)),
    ).then((displaySegments) => {
      if (cancelled || !mapRef.current) return;

      legLinesRef.current.forEach(({ casing, line }) => {
        casing.remove();
        line.remove();
      });

      // Google Maps-style route: a slightly wider dark casing under a
      // colored line, giving the path an outlined look instead of a flat
      // stroke — one such pair per leg (each pair of consecutive recorded
      // points), colored by how long the ranger spent on it: the usual
      // route yellow for a leg passed straight through, darkening toward
      // maroon the longer they dwelled before the next ping.
      const legs: { casing: L.Polyline; line: L.Polyline }[] = [];
      segments.forEach((segment, si) => {
        const display = displaySegments[si];
        for (let i = 1; i < segment.length; i++) {
          const from = segment[i - 1];
          const to = segment[i];
          const durationSeconds =
            (new Date(to.recorded_at).getTime() - new Date(from.recorded_at).getTime()) / 1000;
          const { line: lineColor, casing: casingColor } = legColor(durationSeconds);
          const coords: L.LatLngTuple[] = [display[i - 1], display[i]];
          const tooltip = legTooltip(markerKindFor(to), from, to, durationSeconds);

          const casing = L.polyline(coords, { color: casingColor, weight: 7, opacity: 0.9 })
            .addTo(mapRef.current!)
            .bindTooltip(tooltip, { sticky: true, direction: "top" });
          const line = L.polyline(coords, { color: lineColor, weight: 5 })
            .addTo(mapRef.current!)
            .bindTooltip(tooltip, { sticky: true, direction: "top" });
          legs.push({ casing, line });
        }
      });
      legLinesRef.current = legs;
    });

    startMarkerRef.current?.remove();
    endMarkerRef.current?.remove();
    startMarkerRef.current = null;
    endMarkerRef.current = null;

    const first = points[0];
    const last = points.at(-1);
    if (first) {
      startMarkerRef.current = L.marker([first.latitude, first.longitude], {
        icon: buildEndpointIcon("A", "#16a34a"),
        zIndexOffset: 900,
      })
        .addTo(mapRef.current)
        .bindTooltip("Start", { direction: "top" });
    }
    if (last && last !== first) {
      endMarkerRef.current = L.marker([last.latitude, last.longitude], {
        icon: buildEndpointIcon("B", "#dc2626"),
        zIndexOffset: 900,
      })
        .addTo(mapRef.current)
        .bindTooltip("End", { direction: "top" });
    }

    modeChangeMarkersRef.current.forEach((marker) => marker.remove());
    const modeChangeMarkers: L.Marker[] = [];
    for (let i = 1; i < points.length; i++) {
      const prevKind = markerKindFor(points[i - 1]);
      const kind = markerKindFor(points[i]);
      if (kind === prevKind) continue;

      const point = points[i];
      // See `formatDateTime` above for why `timeZone` must be explicit here.
      const time = new Date(point.recorded_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      });
      const marker = L.marker([point.latitude, point.longitude], {
        icon: buildModeChangeIcon(kind),
        zIndexOffset: 950,
      })
        .addTo(mapRef.current)
        .bindTooltip(`Switched to ${modeLabelFor(kind)} · ${time}`, { direction: "top" });
      modeChangeMarkers.push(marker);
    }
    modeChangeMarkersRef.current = modeChangeMarkers;

    if (last) mapRef.current.panTo([last.latitude, last.longitude]);

    return () => {
      cancelled = true;
    };
  }, [points, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    flagMarkersRef.current.forEach((marker) => marker.remove());
    const flagMarkers: L.Marker[] = [];

    incidents.forEach((incident) => {
      const { latitude, longitude } = incident.location;
      if (latitude === null || longitude === null) return;

      const marker = L.marker([latitude, longitude], {
        icon: buildFlagIcon("#eab308"),
        zIndexOffset: 1000,
      }).addTo(mapRef.current!);
      marker.bindPopup(buildIncidentInfoContent(incident, incidentMediaBaseUrl));
      flagMarkers.push(marker);
    });

    caseReports.forEach((caseReport) => {
      const { latitude, longitude } = caseReport.location;
      if (latitude === null || longitude === null) return;

      const marker = L.marker([latitude, longitude], {
        icon: buildFlagIcon("#dc2626"),
        zIndexOffset: 1001,
      }).addTo(mapRef.current!);
      marker.bindPopup(buildCaseInfoContent(caseReport, caseMediaBaseUrl));
      flagMarkers.push(marker);
    });

    flagMarkersRef.current = flagMarkers;
  }, [incidents, caseReports, ready, incidentMediaBaseUrl, caseMediaBaseUrl]);

  if (points.length === 0) {
    return (
      <div className="relative">
        <div ref={containerRef} className="h-96 w-full rounded-lg border border-zinc-200" />
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center rounded-lg bg-white/70 text-sm text-zinc-500">
          No GPS points recorded yet.
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-96 w-full rounded-lg border border-zinc-200" />;
}
