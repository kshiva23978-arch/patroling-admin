"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PatrolReportEntry } from "@/lib/resources/patrollings";
import { formatMinutes } from "@/lib/duration";

import { trailColorFor } from "./trailColors";

/** Same 10-minute rule as `LiveMap` — a sync gap draws as a break, not a straight line across it. */
const TRAIL_GAP_THRESHOLD_MS = 10 * 60 * 1000;

function splitByGap(points: PatrolReportEntry["route_points"]): L.LatLngTuple[][] {
  const segments: L.LatLngTuple[][] = [];
  let current: L.LatLngTuple[] = [];
  let previousAt: number | null = null;
  for (const point of points) {
    const at = new Date(point.recorded_at).getTime();
    if (previousAt !== null && at - previousAt > TRAIL_GAP_THRESHOLD_MS && current.length > 0) {
      segments.push(current);
      current = [];
    }
    current.push([point.latitude, point.longitude]);
    previousAt = at;
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function flagIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<svg width="18" height="22" viewBox="0 0 18 22"><path d="M3 1v20" stroke="#18181b" stroke-width="2"/><path d="M4 2h12l-3 4 3 4H4z" fill="${color}" stroke="#18181b" stroke-width="1"/></svg>`,
    iconSize: [18, 22],
    iconAnchor: [3, 21],
  });
}

function endpointIcon(label: string, color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3);color:#fff;font:700 10px/14px sans-serif;text-align:center;">${label}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const INDIA_CENTER: L.LatLngTuple = [20.5937, 78.9629];

/**
 * Every matching patrol's GPS trail on one map, each in its own colour
 * (matching the table's swatch), with start/end dots per trail and the
 * usual incident (yellow) / case (red) flags. Raw recorded points, no
 * road-snapping — with dozens of trails the OSRM calls `LiveMap` makes
 * per patrol would take minutes and rate-limit. Hover a trail for the
 * patrol; click to open its detail page.
 */
export function ReportMap({ entries }: { entries: PatrolReportEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current).setView(INDIA_CENTER, 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const bounds = L.latLngBounds([]);

    entries.forEach((entry, index) => {
      const color = trailColorFor(index);
      const leader = entry.patrol_leader?.name || entry.patrol_leader?.employee_id || "—";
      const tooltip = `<strong>${escapeHtml(entry.patrol_id)}</strong><br>${escapeHtml(entry.date)} · ${escapeHtml(
        entry.range?.name ?? "—",
      )}<br>Leader: ${escapeHtml(leader)} · ${entry.distance_km.toFixed(2)} km · ${formatMinutes(entry.duration_minutes)}`;
      const openDetail = () => window.open(`/patrollings/${entry.id}`, "_blank", "noopener");

      const segments = splitByGap(entry.route_points);
      for (const segment of segments) {
        if (segment.length < 2) continue;
        L.polyline(segment, { color: "#ffffff", weight: 7, opacity: 0.8 }).addTo(layer);
        L.polyline(segment, { color, weight: 4, opacity: 0.95 })
          .bindTooltip(tooltip, { sticky: true, direction: "top" })
          .on("click", openDetail)
          .addTo(layer);
        segment.forEach((p) => bounds.extend(p));
      }

      const first = entry.route_points[0];
      const last = entry.route_points.at(-1);
      if (first) {
        L.marker([first.latitude, first.longitude], { icon: endpointIcon("A", color), zIndexOffset: 500 })
          .bindTooltip(`${escapeHtml(entry.patrol_id)} · Start`, { direction: "top" })
          .on("click", openDetail)
          .addTo(layer);
        bounds.extend([first.latitude, first.longitude]);
      }
      if (last && last !== first) {
        L.marker([last.latitude, last.longitude], { icon: endpointIcon("B", color), zIndexOffset: 500 })
          .bindTooltip(`${escapeHtml(entry.patrol_id)} · End`, { direction: "top" })
          .on("click", openDetail)
          .addTo(layer);
      }

      for (const incident of entry.incidents) {
        const { latitude, longitude } = incident.location;
        if (latitude === null || longitude === null) continue;
        L.marker([latitude, longitude], { icon: flagIcon("#eab308"), zIndexOffset: 1000 })
          .bindTooltip(`Incident · ${escapeHtml(incident.name)}<br>${escapeHtml(entry.patrol_id)}`, { direction: "top" })
          .on("click", openDetail)
          .addTo(layer);
        bounds.extend([latitude, longitude]);
      }
      for (const caseReport of entry.case_reports) {
        const { latitude, longitude } = caseReport.location;
        if (latitude === null || longitude === null) continue;
        L.marker([latitude, longitude], { icon: flagIcon("#dc2626"), zIndexOffset: 1001 })
          .bindTooltip(`Case · ${escapeHtml(caseReport.case_number)}<br>${escapeHtml(entry.patrol_id)}`, { direction: "top" })
          .on("click", openDetail)
          .addTo(layer);
        bounds.extend([latitude, longitude]);
      }
    });

    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  }, [entries]);

  const hasTrail = entries.some((e) => e.route_points.length > 0);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[520px] w-full rounded-lg border border-zinc-200" />
      {!hasTrail && (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center rounded-lg bg-white/70 text-sm text-zinc-500">
          {entries.length === 0 ? "No patrols match these filters." : "None of the matching patrols recorded GPS points."}
        </div>
      )}
    </div>
  );
}
