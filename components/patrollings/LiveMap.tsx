"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PatrolCaseRef, PatrolIncidentRef, PatrolRoutePoint } from "@/lib/resources/patrollings";

type MarkerKind = "walking" | "car" | "boat" | "unknown";

function markerKindFor(point: PatrolRoutePoint): MarkerKind {
  if (point.travel_mode === "walking") return "walking";
  if (point.vehicle_type === "boat") return "boat";
  if (point.vehicle_type === "4_wheeler") return "car";
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

function osrmModeFor(point: PatrolRoutePoint): "driving" | null {
  return markerKindFor(point) === "car" ? "driving" : null;
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
// shared public server; longer runs are split into overlapping chunks so
// consecutive requests share a junction point and the result stays
// continuous.
const MAX_POINTS_PER_REQUEST = 100;

async function snapRunToRoads(
  points: PatrolRoutePoint[],
  mode: "driving",
): Promise<L.LatLngTuple[]> {
  const path: L.LatLngTuple[] = [];

  for (let start = 0; start < points.length - 1; start += MAX_POINTS_PER_REQUEST - 1) {
    const chunk = points.slice(start, start + MAX_POINTS_PER_REQUEST);
    const coordinates = chunk.map((p) => `${p.longitude},${p.latitude}`).join(";");

    let chunkPath: L.LatLngTuple[];
    try {
      const response = await throttledFetch(
        `${OSRM_BASE_URL}/route/v1/${mode}/${coordinates}?overview=full&geometries=geojson`,
      );
      const data = await response.json();
      const coords: [number, number][] | undefined = data?.routes?.[0]?.geometry?.coordinates;
      if (!coords || coords.length === 0) throw new Error("No route returned.");
      chunkPath = coords.map(([lng, lat]) => [lat, lng]);
    } catch {
      // No road connects these points (or the request failed) — fall back
      // to a straight line through them rather than dropping the segment.
      chunkPath = chunk.map((p): L.LatLngTuple => [p.latitude, p.longitude]);
    }

    path.push(...(path.length > 0 ? chunkPath.slice(1) : chunkPath));
  }

  return path;
}

/**
 * Builds the map path by snapping each vehicle run of the trail to roads via
 * OSRM and leaving walking/boat/mode-unset runs (and any run a snap request
 * fails for) as straight lines between the raw points. `cache` holds
 * resolved runs keyed by their position in the trail so that, as new points
 * arrive, only the still-growing final run is re-requested — closed runs
 * earlier in the trail are never re-fetched.
 */
async function buildSnappedPath(
  points: PatrolRoutePoint[],
  cache: Map<string, L.LatLngTuple[]>,
): Promise<L.LatLngTuple[]> {
  const groups = groupByMode(points);
  const path: L.LatLngTuple[] = [];
  let index = 0;

  for (const group of groups) {
    const key = `${group.mode ?? "line"}:${index}:${group.points.length}`;
    index += group.points.length;

    let segment = cache.get(key);
    if (!segment) {
      segment =
        group.mode && group.points.length >= 2
          ? await snapRunToRoads(group.points, group.mode)
          : group.points.map((p): L.LatLngTuple => [p.latitude, p.longitude]);
      if (group !== groups.at(-1)) cache.set(key, segment);
    }
    path.push(...segment);
  }

  return path;
}

function modeLabelFor(kind: MarkerKind): string {
  switch (kind) {
    case "walking":
      return "Walking";
    case "boat":
      return "Boat";
    case "car":
      return "4-Wheeler";
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

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
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

function buildIncidentInfoContent(incident: PatrolIncidentRef): string {
  return `
    <div style="min-width:220px;max-width:270px;padding:2px 2px 4px;font-family:ui-sans-serif,system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <span style="display:inline-block;width:9px;height:9px;border-radius:9999px;background:#eab308;"></span>
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:#a16207;">Incident</span>
      </div>
      <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px;">${escapeHtml(incident.name)}</div>
      <div style="font-size:12px;color:#3f3f46;margin-bottom:6px;">${escapeHtml(incident.details)}</div>
      <div style="font-size:11px;color:#71717a;">${formatDateTime(incident.reported_at)}</div>
      ${photoStripHtml(incident.photos, "/api/incident-media")}
    </div>
  `;
}

function buildCaseInfoContent(caseReport: PatrolCaseRef): string {
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
      ${photoStripHtml(caseReport.photos, "/api/case-media")}
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
 * Renders a patrol's GPS trail as a Google Maps-style yellow route — vehicle
 * runs snapped to roads via OSRM, walking/boat runs left as the raw recorded
 * points (a ping every ~30s while the patrol is active) connected in order.
 * No per-point markers are shown, just the path itself — except where the
 * ranger's travel mode actually changed (walking ↔ a vehicle, or between
 * vehicle types), each marked with a small blue badge (hover for the mode
 * switched to and when).
 *
 * Incidents and cases are plotted as flags (yellow/red) wherever they carry
 * a location — click one to see its full details, including photos.
 */
export function LiveMap({
  points,
  incidents,
  caseReports,
}: {
  points: PatrolRoutePoint[];
  incidents: PatrolIncidentRef[];
  caseReports: PatrolCaseRef[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const polylineCasingRef = useRef<L.Polyline | null>(null);
  const snappedSegmentCacheRef = useRef<Map<string, L.LatLngTuple[]>>(new Map());
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

    // Google Maps-style route: a slightly wider dark casing under a yellow
    // line, giving the path an outlined look instead of a flat stroke.
    polylineCasingRef.current = L.polyline([], { color: "#8a6d00", weight: 7, opacity: 0.9 }).addTo(map);
    polylineRef.current = L.polyline([], { color: "#fbbc04", weight: 5 }).addTo(map);
    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      polylineRef.current = null;
      polylineCasingRef.current = null;
      startMarkerRef.current = null;
      endMarkerRef.current = null;
      modeChangeMarkersRef.current = [];
      setReady(false);
    };
    // Only mount once — path updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !polylineRef.current || !polylineCasingRef.current) return;

    let cancelled = false;
    buildSnappedPath(points, snappedSegmentCacheRef.current).then((path) => {
      if (cancelled) return;
      polylineCasingRef.current!.setLatLngs(path);
      polylineRef.current!.setLatLngs(path);
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
      const time = new Date(point.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
      marker.bindPopup(buildIncidentInfoContent(incident));
      flagMarkers.push(marker);
    });

    caseReports.forEach((caseReport) => {
      const { latitude, longitude } = caseReport.location;
      if (latitude === null || longitude === null) return;

      const marker = L.marker([latitude, longitude], {
        icon: buildFlagIcon("#dc2626"),
        zIndexOffset: 1001,
      }).addTo(mapRef.current!);
      marker.bindPopup(buildCaseInfoContent(caseReport));
      flagMarkers.push(marker);
    });

    flagMarkersRef.current = flagMarkers;
  }, [incidents, caseReports, ready]);

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
