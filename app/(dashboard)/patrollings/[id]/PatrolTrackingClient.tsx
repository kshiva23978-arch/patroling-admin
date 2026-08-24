"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LiveMap } from "@/components/patrollings/LiveMap";
import { cumulativeDistancesKm } from "@/lib/geo";
import { cardClass } from "@/lib/ui-classes";
import { patrolStatusBadgeClass, patrolStatusLabel } from "@/lib/patrol-status";
import { fetchPatrollingAction, fetchRoutePointsAction } from "./actions";
import { PatrolDetails } from "./PatrolDetails";
import type { Patrolling, PatrolRoutePoint } from "@/lib/resources/patrollings";

const ROUTE_POLL_MS = 10_000;
const ENTRY_POLL_MS = 20_000;

export function PatrolTrackingClient({
  entryId,
  initialEntry,
  initialRoutePoints,
}: {
  entryId: string;
  initialEntry: Patrolling;
  initialRoutePoints: PatrolRoutePoint[];
}) {
  const [entry, setEntry] = useState(initialEntry);
  const [points, setPoints] = useState(initialRoutePoints);
  const lastRecordedAtRef = useRef(initialRoutePoints.at(-1)?.recorded_at);

  useEffect(() => {
    // Only an in-progress patrol is still generating GPS points or status
    // changes — a pending/completed one has nothing new to poll for.
    if (entry.status !== "in_progress") return;

    const routeInterval = setInterval(async () => {
      try {
        const fresh = await fetchRoutePointsAction(entryId, lastRecordedAtRef.current);
        if (fresh.length > 0) {
          lastRecordedAtRef.current = fresh[fresh.length - 1].recorded_at;
          setPoints((prev) => [...prev, ...fresh]);
        }
      } catch {
        // Transient failure — the next tick will retry.
      }
    }, ROUTE_POLL_MS);

    const entryInterval = setInterval(async () => {
      try {
        setEntry(await fetchPatrollingAction(entryId));
      } catch {
        // Transient failure — the next tick will retry.
      }
    }, ENTRY_POLL_MS);

    return () => {
      clearInterval(routeInterval);
      clearInterval(entryInterval);
    };
  }, [entryId, entry.status]);

  const travelLabel =
    entry.current_travel_mode === "walking"
      ? "Walking"
      : (entry.vehicles.find((v) => v.is_current)?.registration_no ?? "Not set");

  const distanceCoveredKm = useMemo(() => {
    const distances = cumulativeDistancesKm(points.map((p) => ({ lat: p.latitude, lng: p.longitude })));
    return distances.at(-1) ?? 0;
  }, [points]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/patrollings" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
            &larr; Patrollings
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{entry.patrol_id}</h1>
        </div>
        <span className={patrolStatusBadgeClass(entry.status)}>{patrolStatusLabel(entry.status)}</span>
      </div>

      <div className={`grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-6 ${cardClass}`}>
        <Info label="Ranger" value={entry.patrol_leader?.name || entry.patrol_leader?.employee_id || "—"} />
        <Info
          label="Range / Beat"
          value={[entry.range?.name, entry.beat?.name].filter(Boolean).join(" / ") || "—"}
        />
        <Info label="Staff Deployed" value={String(entry.staff_names.length)} />
        <Info label="Traveling By" value={travelLabel} />
        <Info label="Distance Covered" value={`${distanceCoveredKm.toFixed(2)} km`} />
        <Info label="Incidents / Cases" value={`${entry.incidents.length} / ${entry.case_reports.length}`} />
      </div>

      <LiveMap
        points={points}
        incidents={entry.incidents}
        caseReports={entry.case_reports}
        stats={{
          staffCount: entry.staff_names.length,
          incidentsCount: entry.incidents.length,
          casesCount: entry.case_reports.length,
        }}
      />

      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <LegendItem color="#eab308" label="Incident" />
        <LegendItem color="#dc2626" label="Case" />
        <span>Click a flag for details. Hover a route point for travel stats.</span>
      </div>

      {entry.status !== "in_progress" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {entry.status === "pending"
            ? "This patrol hasn't started yet — no GPS trail."
            : "This patrol has ended — showing its final trail."}
        </p>
      )}

      <PatrolDetails entry={entry} points={points} />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}
