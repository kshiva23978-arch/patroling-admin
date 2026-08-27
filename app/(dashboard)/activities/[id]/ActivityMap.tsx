"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cardClass } from "@/lib/ui-classes";
import type { ActivityLocation } from "@/lib/resources/activities";

/** Single-pin map of where an activity was conducted — no trail, no polling
 * (an activity's location is set once, at creation, and never moves), so
 * this is deliberately much simpler than the patrol tracking map. */
export function ActivityMap({ location, name }: { location: ActivityLocation; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const hasFix = location.latitude !== null && location.longitude !== null;

  useEffect(() => {
    if (!containerRef.current || !hasFix) return;

    const center: L.LatLngTuple = [location.latitude!, location.longitude!];
    const map = L.map(containerRef.current).setView(center, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.marker(center)
      .addTo(map)
      .bindPopup(`<strong>${escapeHtml(name)}</strong>${location.address ? `<br/>${escapeHtml(location.address)}` : ""}`)
      .openPopup();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFix, location.latitude, location.longitude]);

  if (!hasFix) {
    return (
      <div className={`flex h-64 items-center justify-center text-sm text-zinc-500 ${cardClass}`}>
        No location was captured for this activity.
      </div>
    );
  }

  return <div ref={containerRef} className={`h-64 w-full overflow-hidden ${cardClass}`} />;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
