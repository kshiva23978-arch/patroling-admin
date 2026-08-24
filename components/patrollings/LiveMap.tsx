"use client";

import { useEffect, useRef, useState } from "react";
import { cumulativeDistancesKm } from "@/lib/geo";
import type { PatrolCaseRef, PatrolIncidentRef, PatrolRoutePoint } from "@/lib/resources/patrollings";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

declare global {
  interface Window {
    __patrolMapsCallback?: () => void;
  }
}

let loaderPromise: Promise<void> | null = null;

/** Loads the Maps JS API script once and caches the promise across mounts. */
function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    window.__patrolMapsCallback = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&loading=async&callback=__patrolMapsCallback`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

type MarkerKind = "walking" | "car" | "boat" | "unknown";

function markerKindFor(point: PatrolRoutePoint): MarkerKind {
  if (point.travel_mode === "walking") return "walking";
  if (point.vehicle_type === "boat") return "boat";
  if (point.vehicle_type === "4_wheeler") return "car";
  return "unknown";
}

/** Directions API travel mode for snapping this point's segment to roads, or
 * null if there's no road network to snap to (boat travels open water; an
 * unset mode has no vehicle to route for). */
function directionsModeFor(point: PatrolRoutePoint): google.maps.TravelMode | null {
  switch (markerKindFor(point)) {
    case "walking":
      return google.maps.TravelMode.WALKING;
    case "car":
      return google.maps.TravelMode.DRIVING;
    default:
      return null;
  }
}

function modeLabelFor(point: PatrolRoutePoint): string {
  switch (markerKindFor(point)) {
    case "walking":
      return "Walking";
    case "boat":
      return "Boat";
    case "car":
      return "4-Wheeler";
    default:
      // Genuinely possible mid-patrol: the ranger toggled a travel mode off
      // (in the app's "Currently Traveling" switches) without picking a new
      // one before this ping fired.
      return "Mode not set";
  }
}

/** Small white glyph, positioned to sit inside a 24x24 badge circle. */
function glyphMarkup(kind: MarkerKind): string {
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

function buildMarkerIcon(kind: MarkerKind, highlighted: boolean): google.maps.Icon {
  const size = highlighted ? 32 : 20;
  const bgColor = highlighted ? "#059669" : "#52525b";
  const ring = highlighted
    ? '<circle cx="12" cy="12" r="11" fill="none" stroke="white" stroke-width="1.5"/>'
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
    <circle cx="12" cy="12" r="11" fill="${bgColor}"/>
    ${ring}
    ${glyphMarkup(kind)}
  </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

/** A pin-style flag: pole planted at the point, flag pennant near the top. */
function buildFlagIcon(color: string): google.maps.Icon {
  const size = 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
    <line x1="5" y1="21" x2="5" y2="3" stroke="white" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="5" y1="21" x2="5" y2="3" stroke="#27272a" stroke-width="1.75" stroke-linecap="round"/>
    <path d="M5 4h14l-4 4 4 4H5z" fill="${color}" stroke="white" stroke-width="1" stroke-linejoin="round"/>
  </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(6, size - 3),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function buildInfoContent(
  point: PatrolRoutePoint,
  distanceSoFarKm: number,
  stats: PatrolStats,
): string {
  const time = new Date(point.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return `
    <div style="min-width:210px;padding:2px 2px 4px;font-family:ui-sans-serif,system-ui,sans-serif;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:13px;font-weight:700;color:#0f172a;">${modeLabelFor(point)}</span>
        <span style="font-size:11px;color:#71717a;">${time}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;row-gap:8px;column-gap:16px;">
        ${statBlock("Persons", String(stats.staffCount))}
        ${statBlock("Distance", `${distanceSoFarKm.toFixed(2)} km`)}
        ${statBlock("Incidents", String(stats.incidentsCount))}
        ${statBlock("Cases", String(stats.casesCount))}
      </div>
    </div>
  `;
}

export interface PatrolStats {
  staffCount: number;
  incidentsCount: number;
  casesCount: number;
}

type ModeGroup = { mode: google.maps.TravelMode | null; points: PatrolRoutePoint[] };

/** Splits the trail into runs of consecutive points sharing the same
 * directions mode, so each run can be snapped to roads as one path. */
function groupByMode(points: PatrolRoutePoint[]): ModeGroup[] {
  const groups: ModeGroup[] = [];
  for (const point of points) {
    const mode = directionsModeFor(point);
    const current = groups.at(-1);
    if (current && current.mode === mode) {
      current.points.push(point);
    } else {
      groups.push({ mode, points: [point] });
    }
  }
  return groups;
}

// Directions API allows at most 25 stops (origin + destination + 23
// waypoints) per request; longer runs are split into overlapping chunks so
// consecutive requests share a junction point and the result stays continuous.
const MAX_STOPS_PER_REQUEST = 25;

async function snapRunToRoads(
  points: PatrolRoutePoint[],
  mode: google.maps.TravelMode,
  directionsService: google.maps.DirectionsService,
): Promise<google.maps.LatLngLiteral[]> {
  const path: google.maps.LatLngLiteral[] = [];

  for (let start = 0; start < points.length - 1; start += MAX_STOPS_PER_REQUEST - 1) {
    const chunk = points.slice(start, start + MAX_STOPS_PER_REQUEST);
    const origin = { lat: chunk[0].latitude, lng: chunk[0].longitude };
    const destination = { lat: chunk.at(-1)!.latitude, lng: chunk.at(-1)!.longitude };
    const waypoints = chunk
      .slice(1, -1)
      .map((p) => ({ location: { lat: p.latitude, lng: p.longitude }, stopover: false }));

    let chunkPath: google.maps.LatLngLiteral[];
    try {
      const result = await directionsService.route({ origin, destination, waypoints, travelMode: mode });
      chunkPath = (result.routes[0]?.overview_path ?? []).map((ll) => ({ lat: ll.lat(), lng: ll.lng() }));
      if (chunkPath.length === 0) throw new Error("No route returned.");
    } catch {
      // No road connects these points (or the request failed) — fall back to
      // a straight line through them rather than dropping the segment.
      chunkPath = chunk.map((p) => ({ lat: p.latitude, lng: p.longitude }));
    }

    path.push(...(path.length > 0 ? chunkPath.slice(1) : chunkPath));
  }

  return path;
}

/**
 * Builds the map path by snapping each walking/driving run of the trail to
 * roads via the Directions API and leaving boat/mode-unset runs (and any
 * run a snap request fails for) as straight lines between the raw points.
 * `cache` holds resolved runs keyed by their position in the trail so that,
 * as new points arrive, only the still-growing final run is re-requested —
 * closed runs earlier in the trail are never re-fetched.
 */
async function buildSnappedPath(
  points: PatrolRoutePoint[],
  directionsService: google.maps.DirectionsService,
  cache: Map<string, google.maps.LatLngLiteral[]>,
): Promise<google.maps.LatLngLiteral[]> {
  const groups = groupByMode(points);
  const path: google.maps.LatLngLiteral[] = [];
  let index = 0;

  for (const group of groups) {
    const key = `${group.mode ?? "line"}:${index}:${group.points.length}`;
    index += group.points.length;

    let segment = cache.get(key);
    if (!segment) {
      segment =
        group.mode && group.points.length >= 2
          ? await snapRunToRoads(group.points, group.mode, directionsService)
          : group.points.map((p) => ({ lat: p.latitude, lng: p.longitude }));
      if (group !== groups.at(-1)) cache.set(key, segment);
    }
    path.push(...segment);
  }

  return path;
}

/**
 * Renders a patrol's GPS trail as a road-snapped polyline (walking/driving
 * runs are routed via the Directions API; boat runs have no road network, so
 * they stay a straight line) with one marker per recorded point — the
 * marker's glyph reflects how the ranger was traveling at that point
 * (walking/4-wheeler/boat), and the most recent point is highlighted as the
 * current position. Hovering any point shows a card with that point's travel
 * mode/time plus the patrol's overall stats (persons, distance covered so
 * far, incidents, cases).
 *
 * Incidents and cases are plotted as flags (yellow/red) wherever they carry
 * a location — click one to see its full details, including photos.
 */
export function LiveMap({
  points,
  stats,
  incidents,
  caseReports,
}: {
  points: PatrolRoutePoint[];
  stats: PatrolStats;
  incidents: PatrolIncidentRef[];
  caseReports: PatrolCaseRef[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const snappedSegmentCacheRef = useRef<Map<string, google.maps.LatLngLiteral[]>>(new Map());
  const markersRef = useRef<google.maps.Marker[]>([]);
  const flagMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const statsRef = useRef(stats);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    API_KEY ? null : "Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in admin/.env.local to enable the live-tracking map.",
  );

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    if (!API_KEY) return;

    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const last = points.at(-1);
        const center = last ? { lat: last.latitude, lng: last.longitude } : { lat: 20.5937, lng: 78.9629 };

        mapRef.current = new google.maps.Map(containerRef.current, {
          center,
          zoom: last ? 15 : 5,
          mapTypeId: "hybrid",
        });
        polylineRef.current = new google.maps.Polyline({
          map: mapRef.current,
          path: [],
          strokeColor: "#15803d",
          strokeWeight: 4,
        });
        infoWindowRef.current = new google.maps.InfoWindow();
        directionsServiceRef.current = new google.maps.DirectionsService();
        setReady(true);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load Google Maps.");
      });

    return () => {
      cancelled = true;
    };
    // Only load once per mount — path/marker updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !polylineRef.current || !directionsServiceRef.current) return;

    let cancelled = false;
    buildSnappedPath(points, directionsServiceRef.current, snappedSegmentCacheRef.current).then((path) => {
      if (!cancelled) polylineRef.current!.setPath(path);
    });

    const distances = cumulativeDistancesKm(points.map((p) => ({ lat: p.latitude, lng: p.longitude })));

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = points.map((point, index) => {
      const isLast = index === points.length - 1;
      const marker = new google.maps.Marker({
        map: mapRef.current!,
        position: { lat: point.latitude, lng: point.longitude },
        icon: buildMarkerIcon(markerKindFor(point), isLast),
        zIndex: isLast ? 999 : index,
        optimized: true,
      });

      marker.addListener("mouseover", () => {
        infoWindowRef.current?.setContent(buildInfoContent(point, distances[index], statsRef.current));
        infoWindowRef.current?.open({ map: mapRef.current!, anchor: marker });
      });
      marker.addListener("mouseout", () => infoWindowRef.current?.close());

      return marker;
    });

    const last = points.at(-1);
    if (last) mapRef.current.panTo({ lat: last.latitude, lng: last.longitude });

    return () => {
      cancelled = true;
    };
  }, [points, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    flagMarkersRef.current.forEach((marker) => marker.setMap(null));
    const flagMarkers: google.maps.Marker[] = [];

    incidents.forEach((incident) => {
      const { latitude, longitude } = incident.location;
      if (latitude === null || longitude === null) return;

      const marker = new google.maps.Marker({
        map: mapRef.current!,
        position: { lat: latitude, lng: longitude },
        icon: buildFlagIcon("#eab308"),
        zIndex: 1000,
      });
      marker.addListener("click", () => {
        infoWindowRef.current?.setContent(buildIncidentInfoContent(incident));
        infoWindowRef.current?.open({ map: mapRef.current!, anchor: marker });
      });
      flagMarkers.push(marker);
    });

    caseReports.forEach((caseReport) => {
      const { latitude, longitude } = caseReport.location;
      if (latitude === null || longitude === null) return;

      const marker = new google.maps.Marker({
        map: mapRef.current!,
        position: { lat: latitude, lng: longitude },
        icon: buildFlagIcon("#dc2626"),
        zIndex: 1001,
      });
      marker.addListener("click", () => {
        infoWindowRef.current?.setContent(buildCaseInfoContent(caseReport));
        infoWindowRef.current?.open({ map: mapRef.current!, anchor: marker });
      });
      flagMarkers.push(marker);
    });

    flagMarkersRef.current = flagMarkers;
  }, [incidents, caseReports, ready]);

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        {error}
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="relative">
        <div ref={containerRef} className="h-96 w-full rounded-lg border border-zinc-200 dark:border-zinc-800" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 text-sm text-zinc-500 dark:bg-zinc-950/70 dark:text-zinc-400">
          No GPS points recorded yet.
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-96 w-full rounded-lg border border-zinc-200 dark:border-zinc-800" />;
}
