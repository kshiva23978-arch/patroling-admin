"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui-classes";
import type { Destination } from "@/lib/resources/destinations";
import type { Beach } from "@/lib/resources/beaches";
import type { Country } from "@/lib/resources/countries";
import type { BeachCleaningRangerOption } from "@/lib/resources/beach-cleaning-activities";
import { MultiSelect } from "./MultiSelect";

/**
 * Destination / Beach / Ranger / date-range filters for the report page —
 * same "narrow beaches to the selected destination(s)" UX as the list
 * page's own `BeachCleaningFilters`, plus a date range. Destination and
 * Beach are multi-selects (checkbox dropdowns): picking several of either
 * combines them into one report, and nothing picked means all — as is
 * Origin (the litter's country of origin, which narrows the report's rows
 * rather than which drives are included). A beach
 * only stays selected while its destination is (or no destination is
 * chosen at all), so the two can't contradict each other. Unlike the list filters
 * (which navigate immediately on change), this batches every field behind
 * a "Generate Report" button — re-running the aggregation on every
 * keystroke of a date field would be wasteful.
 */
export function ReportFilters({
  destinations,
  beaches,
  rangers,
  countries,
  currentDestinationIds,
  currentBeachIds,
  currentRangerId,
  currentCountryIds,
  currentDateFrom,
  currentDateTo,
}: {
  destinations: Destination[];
  beaches: Beach[];
  rangers: BeachCleaningRangerOption[];
  countries: Country[];
  currentDestinationIds: string[];
  currentBeachIds: string[];
  currentRangerId?: string;
  currentCountryIds: string[];
  currentDateFrom?: string;
  currentDateTo?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [destinationIds, setDestinationIds] = useState<string[]>(currentDestinationIds);
  const [beachIds, setBeachIds] = useState<string[]>(currentBeachIds);
  const [rangerId, setRangerId] = useState(currentRangerId ?? "");
  const [countryIds, setCountryIds] = useState<string[]>(currentCountryIds);
  const [dateFrom, setDateFrom] = useState(currentDateFrom ?? "");
  const [dateTo, setDateTo] = useState(currentDateTo ?? "");

  const beachOptions = destinationIds.length > 0 ? beaches.filter((b) => destinationIds.includes(b.destination_id)) : beaches;
  const beachOptionIds = new Set(beachOptions.map((b) => b.id));
  const rangerLabel = (r: BeachCleaningRangerOption) => r.name || r.employee_id;

  const generate = () => {
    const params = new URLSearchParams();
    for (const id of destinationIds) params.append("destination_id", id);
    for (const id of beachIds) if (beachOptionIds.has(id)) params.append("beach_id", id);
    if (rangerId) params.set("created_by", rangerId);
    for (const id of countryIds) params.append("country_id", id);
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
        <MultiSelect
          options={destinations.map((d) => ({ value: d.id, label: d.name }))}
          selected={destinationIds}
          onChange={(next) => {
            setDestinationIds(next);
            // Drop any beach whose destination is no longer part of the selection.
            if (next.length > 0) {
              setBeachIds((prev) =>
                prev.filter((id) => beaches.some((b) => b.id === id && next.includes(b.destination_id))),
              );
            }
          }}
          allLabel="All Destinations"
          noun="destinations"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Beach</label>
        <MultiSelect
          options={beachOptions.map((b) => ({ value: b.id, label: b.name }))}
          selected={beachIds.filter((id) => beachOptionIds.has(id))}
          onChange={setBeachIds}
          allLabel="All Beaches"
          noun="beaches"
          disabled={isPending}
        />
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
        <label className={labelClass}>Origin</label>
        <MultiSelect
          options={countries.map((c) => ({ value: c.id, label: c.country_name }))}
          selected={countryIds}
          onChange={setCountryIds}
          allLabel="All Origins"
          noun="origins"
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
