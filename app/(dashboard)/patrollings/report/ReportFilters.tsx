"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui-classes";
import type { Range } from "@/lib/resources/ranges";
import type { PatrolStatus } from "@/lib/resources/patrollings";

export interface PatrolReportSelection {
  rangeIds: string[];
  staffNames: string[];
  caseRecorded: ("yes" | "no")[];
  incidentRecorded: ("yes" | "no")[];
  statuses: PatrolStatus[];
  dateFrom?: string;
  dateTo?: string;
}

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const STATUS_OPTIONS: { value: PatrolStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Not Started" },
];

/**
 * Every filter is a checkbox multi-select ([MultiSelect]) — nothing chosen
 * means "all" — plus a date window, batched behind a "Generate Report"
 * button (the report re-fetches every trail, so it shouldn't re-run on
 * each click). Selections are written to the URL as repeated params.
 */
export function ReportFilters({
  ranges,
  staffOptions,
  current,
}: {
  ranges: Range[];
  staffOptions: string[];
  current: PatrolReportSelection;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rangeIds, setRangeIds] = useState(current.rangeIds);
  const [staffNames, setStaffNames] = useState(current.staffNames);
  const [caseRecorded, setCaseRecorded] = useState<string[]>(current.caseRecorded);
  const [incidentRecorded, setIncidentRecorded] = useState<string[]>(current.incidentRecorded);
  const [statuses, setStatuses] = useState<string[]>(current.statuses);
  const [dateFrom, setDateFrom] = useState(current.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(current.dateTo ?? "");

  const generate = () => {
    const params = new URLSearchParams();
    for (const id of rangeIds) params.append("range_id", id);
    for (const name of staffNames) params.append("staff", name);
    for (const v of caseRecorded) params.append("case_recorded", v);
    for (const v of incidentRecorded) params.append("incident_recorded", v);
    for (const s of statuses) params.append("status", s);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const query = params.toString();
    startTransition(() => {
      router.push(`/patrollings/report${query ? `?${query}` : ""}`);
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className={labelClass}>Range</label>
        <MultiSelect
          options={ranges.map((r) => ({ value: r.id, label: r.range_name }))}
          selected={rangeIds}
          onChange={setRangeIds}
          allLabel="All Ranges"
          noun="ranges"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Staff Deployed</label>
        <MultiSelect
          options={staffOptions.map((name) => ({ value: name, label: name }))}
          selected={staffNames}
          onChange={setStaffNames}
          allLabel="All Staff"
          noun="staff"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Case Recorded</label>
        <MultiSelect
          options={YES_NO_OPTIONS}
          selected={caseRecorded}
          onChange={setCaseRecorded}
          allLabel="Any"
          noun="selected"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Incident Recorded</label>
        <MultiSelect
          options={YES_NO_OPTIONS}
          selected={incidentRecorded}
          onChange={setIncidentRecorded}
          allLabel="Any"
          noun="selected"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Status</label>
        <MultiSelect
          options={STATUS_OPTIONS}
          selected={statuses}
          onChange={setStatuses}
          allLabel="All Statuses"
          noun="statuses"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>From</label>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} w-auto`} />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>To</label>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClass} w-auto`} />
      </div>

      <button type="button" onClick={generate} disabled={isPending} className={primaryButtonClass}>
        {isPending ? (
          <>
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </>
        ) : (
          "Generate Report"
        )}
      </button>
    </div>
  );
}
