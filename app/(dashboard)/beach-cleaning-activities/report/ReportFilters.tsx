"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui-classes";
import type { Destination } from "@/lib/resources/destinations";
import type { Beach } from "@/lib/resources/beaches";
import type { BeachCleaningRangerOption } from "@/lib/resources/beach-cleaning-activities";

/**
 * Destination / Beach / Ranger / date-range filters for the report page —
 * same "narrow beaches to the selected destination" UX as the list page's
 * own `BeachCleaningFilters`, plus a date range. Unlike the list filters
 * (which navigate immediately on change), this batches every field behind
 * a "Generate Report" button — re-running the aggregation on every
 * keystroke of a date field would be wasteful.
 */
export function ReportFilters({
  destinations,
  beaches,
  rangers,
  currentDestinationId,
  currentBeachId,
  currentRangerId,
  currentDateFrom,
  currentDateTo,
}: {
  destinations: Destination[];
  beaches: Beach[];
  rangers: BeachCleaningRangerOption[];
  currentDestinationId?: string;
  currentBeachId?: string;
  currentRangerId?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [destinationId, setDestinationId] = useState(currentDestinationId ?? "");
  const [beachId, setBeachId] = useState(currentBeachId ?? "");
  const [rangerId, setRangerId] = useState(currentRangerId ?? "");
  const [dateFrom, setDateFrom] = useState(currentDateFrom ?? "");
  const [dateTo, setDateTo] = useState(currentDateTo ?? "");

  const beachOptions = destinationId ? beaches.filter((b) => b.destination_id === destinationId) : beaches;
  const rangerLabel = (r: BeachCleaningRangerOption) => r.name || r.employee_id;

  const generate = () => {
    const params = new URLSearchParams();
    if (destinationId) params.set("destination_id", destinationId);
    if (beachId && beaches.some((b) => b.id === beachId && b.destination_id === destinationId)) {
      params.set("beach_id", beachId);
    }
    if (rangerId) params.set("created_by", rangerId);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const query = params.toString();
    startTransition(() => {
      router.push(`/beach-cleaning-activities/report${query ? `?${query}` : ""}`);
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className={labelClass}>Destination</label>
        <select
          value={destinationId}
          onChange={(e) => {
            setDestinationId(e.target.value);
            setBeachId("");
          }}
          className={`${inputClass} w-auto`}
        >
          <option value="">All Destinations</option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Beach</label>
        <select value={beachId} onChange={(e) => setBeachId(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="">All Beaches</option>
          {beachOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Ranger</label>
        <select value={rangerId} onChange={(e) => setRangerId(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="">All Rangers</option>
          {rangers.map((r) => (
            <option key={r.id} value={r.id}>
              {rangerLabel(r)}
            </option>
          ))}
        </select>
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
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
              />
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
