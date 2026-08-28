"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LiveMap } from "@/components/patrollings/LiveMap";
import { cumulativeDistancesKm } from "@/lib/geo";
import { cardClass } from "@/lib/ui-classes";
import { patrolStatusBadgeClass, patrolStatusLabel } from "@/lib/patrol-status";
import { fetchCaseEntryAction, fetchCaseRoutePointsAction } from "./actions";
import { CaseDetails } from "./CaseDetails";
import type { CaseEntry, CaseRoutePoint } from "@/lib/resources/case-entries";

const ROUTE_POLL_MS = 10_000;
const ENTRY_POLL_MS = 20_000;

export function CaseTrackingClient({
  caseId,
  initialEntry,
  initialRoutePoints,
}: {
  caseId: string;
  initialEntry: CaseEntry;
  initialRoutePoints: CaseRoutePoint[];
}) {
  const [entry, setEntry] = useState(initialEntry);
  const [points, setPoints] = useState(initialRoutePoints);
  const lastRecordedAtRef = useRef(initialRoutePoints.at(-1)?.recorded_at);

  useEffect(() => {
    // Only an in-progress case is still generating GPS points or status
    // changes — a pending/completed one has nothing new to poll for.
    if (entry.status !== "in_progress") return;

    const routeInterval = setInterval(async () => {
      try {
        const fresh = await fetchCaseRoutePointsAction(caseId, lastRecordedAtRef.current);
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
        setEntry(await fetchCaseEntryAction(caseId));
      } catch {
        // Transient failure — the next tick will retry.
      }
    }, ENTRY_POLL_MS);

    return () => {
      clearInterval(routeInterval);
      clearInterval(entryInterval);
    };
  }, [caseId, entry.status]);

  const travelLabel =
    entry.current_travel_mode === "walking"
      ? "Walking"
      : (entry.vehicles.find((v) => v.is_current)?.registration_no ?? "Not set");

  const distanceCoveredKm = useMemo(() => {
    const distances = cumulativeDistancesKm(points.map((p) => ({ lat: p.latitude, lng: p.longitude })));
    return distances.at(-1) ?? 0;
  }, [points]);

  // LiveMap's `caseReports` prop expects a `case_number` field (built for the
  // Patrol module's case reports) — a Case's filings carry the same shape
  // under `filing_number` instead, so remap rather than fork the map component.
  const filingsAsCaseReports = useMemo(
    () => entry.filings.map((f) => ({ ...f, case_number: f.filing_number })),
    [entry.filings],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/case-entries" className="text-sm text-zinc-500 hover:underline">
            &larr; Cases
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">{entry.case_number}</h1>
        </div>
        <span className={patrolStatusBadgeClass(entry.status)}>{patrolStatusLabel(entry.status)}</span>
      </div>

      <div className={`grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-6 ${cardClass}`}>
        <Info label="Ranger" value={entry.leader?.name || entry.leader?.employee_id || "—"} />
        <Info
          label="Range / Beat"
          value={[entry.range?.name, entry.beat?.name].filter(Boolean).join(" / ") || "—"}
        />
        <Info label="Staff Deployed" value={String(entry.staff_names.length)} />
        <Info label="Traveling By" value={travelLabel} />
        <Info label="Distance Covered" value={`${distanceCoveredKm.toFixed(2)} km`} />
        <Info label="Incidents / Filings" value={`${entry.incidents.length} / ${entry.filings.length}`} />
      </div>

      <LiveMap
        points={points}
        incidents={entry.incidents}
        caseReports={filingsAsCaseReports}
        incidentMediaBaseUrl="/api/case-incident-media"
        caseMediaBaseUrl="/api/case-filing-media"
      />

      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <LegendItem color="#16a34a" label="Start (A)" />
        <LegendItem color="#dc2626" label="End (B)" />
        <LegendItem color="#2563eb" label="Travel Mode Change" />
        <LegendItem color="#eab308" label="Incident" />
        <LegendItem color="#dc2626" label="Filing" />
        <span>Click a flag for details.</span>
      </div>

      {entry.status !== "in_progress" && (
        <p className="text-sm text-zinc-500">
          {entry.status === "pending"
            ? "This case hasn't started yet — no GPS trail."
            : "This case has ended — showing its final trail."}
        </p>
      )}

      <CaseDetails entry={entry} points={points} />
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
