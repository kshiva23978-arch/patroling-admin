"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { PatrolReportData, PatrolReportEntry } from "@/lib/resources/patrollings";
import { cardClass } from "@/lib/ui-classes";
import { patrolStatusBadgeClass, patrolStatusLabel } from "@/lib/patrol-status";
import { formatMinutes } from "@/lib/duration";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { trailColorFor } from "./trailColors";

// Leaflet touches `window` at import time, so the map is client-only.
const ReportMap = dynamic(() => import("./ReportMap").then((m) => m.ReportMap), {
  ssr: false,
  loading: () => <div className="h-[520px] w-full animate-pulse rounded-lg border border-zinc-200 bg-zinc-50" />,
});

export interface PatrolReportLabels {
  ranges: string;
  staff: string;
  caseRecorded: string;
  incidentRecorded: string;
  statuses: string;
  dateRange: string;
}

export function ReportContent({ report, labels }: { report: PatrolReportData; labels: PatrolReportLabels }) {
  const { summary, entries } = report;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <DownloadPdfButton report={report} labels={labels} />
      </div>

      <div className={`p-4 ${cardClass}`}>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
          <SummaryField label="Range" value={labels.ranges} />
          <SummaryField label="Staff Deployed" value={labels.staff} />
          <SummaryField label="Case Recorded" value={labels.caseRecorded} />
          <SummaryField label="Incident Recorded" value={labels.incidentRecorded} />
          <SummaryField label="Status" value={labels.statuses} />
          <SummaryField label="Date Range" value={labels.dateRange} />
        </dl>
      </div>

      {summary.truncated && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {summary.matched_count} patrols match, but only the first {summary.patrol_count} are shown — narrow the date range or
          ranges for a complete report.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Patrols" value={String(summary.patrol_count)} />
        <Stat label="Distance Covered" value={`${summary.total_distance_km.toFixed(2)} km`} />
        <Stat label="Total Duration" value={formatMinutes(summary.total_duration_minutes)} />
        <Stat label="Cases Recorded" value={String(summary.case_count)} />
        <Stat label="Incidents Recorded" value={String(summary.incident_count)} />
      </div>

      <div className={`space-y-3 p-4 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-zinc-900">Route Map</h2>
        <ReportMap entries={entries} />
        <p className="text-xs text-zinc-500">
          One colour per patrol (matches the table). A = start, B = end; yellow flags are incidents, red flags are cases.
          Hover a route for its patrol, click to open it.
        </p>
      </div>

      {summary.by_range.length > 1 && (
        <div className={`space-y-3 p-4 ${cardClass}`}>
          <h2 className="text-sm font-semibold text-zinc-900">By Range</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2">Range</th>
                  <th className="px-3 py-2 text-right">Patrols</th>
                  <th className="px-3 py-2 text-right">Distance (km)</th>
                  <th className="px-3 py-2 text-right">Duration</th>
                  <th className="px-3 py-2 text-right">Cases</th>
                  <th className="px-3 py-2 text-right">Incidents</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_range.map((row) => (
                  <tr key={row.range} className="border-b border-zinc-100">
                    <td className="px-3 py-2 text-zinc-900">{row.range}</td>
                    <td className="px-3 py-2 text-right">{row.patrols}</td>
                    <td className="px-3 py-2 text-right">{row.distance_km.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{formatMinutes(row.duration_minutes)}</td>
                    <td className="px-3 py-2 text-right">{row.cases}</td>
                    <td className="px-3 py-2 text-right">{row.incidents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={`space-y-3 p-4 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-zinc-900">Patrols ({entries.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2">Patrol ID</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Range / Beat</th>
                <th className="px-3 py-2">Leader</th>
                <th className="px-3 py-2">Staff Deployed</th>
                <th className="px-3 py-2 text-right">Distance (km)</th>
                <th className="px-3 py-2 text-right">Duration</th>
                <th className="px-3 py-2 text-right">Cases</th>
                <th className="px-3 py-2 text-right">Incidents</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-6 text-center text-zinc-500">
                    No patrols match these filters.
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => <PatrolRow key={entry.id} entry={entry} color={trailColorFor(index)} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PatrolRow({ entry, color }: { entry: PatrolReportEntry; color: string }) {
  const leader = entry.patrol_leader?.name || entry.patrol_leader?.employee_id || "—";
  return (
    <tr className="border-b border-zinc-100 align-top">
      <td className="px-3 py-2">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: color }} aria-hidden="true" />
      </td>
      <td className="px-3 py-2">
        <Link href={`/patrollings/${entry.id}`} className="font-medium text-zinc-900 hover:underline">
          {entry.patrol_id}
        </Link>
      </td>
      <td className="whitespace-nowrap px-3 py-2">{entry.date}</td>
      <td className="px-3 py-2">
        {entry.range?.name ?? "—"}
        {entry.beat && <span className="text-zinc-500"> / {entry.beat.name}</span>}
      </td>
      <td className="px-3 py-2">{leader}</td>
      <td className="max-w-xs px-3 py-2 text-zinc-700">{entry.staff_names.length ? entry.staff_names.join(", ") : "—"}</td>
      <td className="px-3 py-2 text-right">{entry.distance_km.toFixed(2)}</td>
      <td className="whitespace-nowrap px-3 py-2 text-right">{formatMinutes(entry.duration_minutes)}</td>
      <td className="px-3 py-2 text-right">{entry.case_reports.length}</td>
      <td className="px-3 py-2 text-right">{entry.incidents.length}</td>
      <td className="px-3 py-2">
        <span className={patrolStatusBadgeClass(entry.status)}>{patrolStatusLabel(entry.status)}</span>
      </td>
    </tr>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-900">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={`p-5 ${cardClass}`}>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
