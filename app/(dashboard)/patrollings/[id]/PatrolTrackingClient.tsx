"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LiveMap } from "@/components/patrollings/LiveMap";
import { cumulativeDistancesKm } from "@/lib/geo";
import { cardClass } from "@/lib/ui-classes";
import { patrolStatusBadgeClass, patrolStatusLabel } from "@/lib/patrol-status";
import { fetchPatrollingAction, fetchRoutePointsAction } from "./actions";
import { PatrolDetails } from "./PatrolDetails";
import type { Patrolling, PatrolCommentRef, PatrolRoutePoint } from "@/lib/resources/patrollings";

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

  const handleCommentAdded = (comment: PatrolCommentRef) => {
    setEntry((prev) => ({ ...prev, comments: [...prev.comments, comment] }));
  };

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
          <Link href="/patrollings" className="text-sm text-zinc-500 hover:underline">
            &larr; Patrollings
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">{entry.patrol_id}</h1>
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

      <LiveMap points={points} incidents={entry.incidents} caseReports={entry.case_reports} />

      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <LegendItem color="#16a34a" label="Start (A)" />
        <LegendItem color="#dc2626" label="End (B)" />
        <LegendItem color="#2563eb" label="Travel Mode Change" />
        <LegendItem color="#eab308" label="Incident" />
        <LegendItem color="#dc2626" label="Case" />
        <span>Click a flag for details.</span>
      </div>

      {entry.status !== "in_progress" && (
        <p className="text-sm text-zinc-500">
          {entry.status === "pending"
            ? "This patrol hasn't started yet — no GPS trail."
            : "This patrol has ended — showing its final trail."}
        </p>
      )}

      <PatrolDetails entry={entry} points={points} onCommentAdded={handleCommentAdded} />
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
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}
