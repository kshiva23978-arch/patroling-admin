"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass, secondaryButtonClass } from "@/lib/ui-classes";
import type { Range } from "@/lib/resources/ranges";

/** Range + patrol-date-range filter bar for the admin Dashboard. */
export function DashboardFilters({
  ranges,
  currentRangeId,
  currentFrom,
  currentTo,
}: {
  ranges: Range[];
  currentRangeId?: string;
  currentFrom?: string;
  currentTo?: string;
}) {
  const router = useRouter();
  const [rangeId, setRangeId] = useState(currentRangeId ?? "");
  const [from, setFrom] = useState(currentFrom ?? "");
  const [to, setTo] = useState(currentTo ?? "");

  const apply = (next: { rangeId: string; from: string; to: string }) => {
    const params = new URLSearchParams();
    if (next.rangeId) params.set("range", next.rangeId);
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    const query = params.toString();
    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Range</label>
        <select
          value={rangeId}
          onChange={(e) => {
            setRangeId(e.target.value);
            apply({ rangeId: e.target.value, from, to });
          }}
          className={`${inputClass} w-auto`}
        >
          <option value="">All Ranges</option>
          {ranges.map((r) => (
            <option key={r.id} value={r.id}>
              {r.range_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">From</label>
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => setFrom(e.target.value)}
          className={`${inputClass} w-auto`}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">To</label>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
          className={`${inputClass} w-auto`}
        />
      </div>
      <button
        type="button"
        onClick={() => apply({ rangeId, from, to })}
        className={secondaryButtonClass}
      >
        Apply
      </button>
      {(rangeId || from || to) && (
        <button
          type="button"
          onClick={() => {
            setRangeId("");
            setFrom("");
            setTo("");
            router.push("/dashboard");
          }}
          className={secondaryButtonClass}
        >
          Clear
        </button>
      )}
    </div>
  );
}
