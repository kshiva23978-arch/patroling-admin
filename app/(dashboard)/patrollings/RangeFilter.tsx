"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "@/lib/ui-classes";
import type { Range } from "@/lib/resources/ranges";

/** Range dropdown for the Patrollings list — preserves the status filter. */
export function RangeFilter({
  ranges,
  currentRangeId,
  currentStatus,
}: {
  ranges: Range[];
  currentRangeId?: string;
  currentStatus?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={currentRangeId ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams();
        if (currentStatus) params.set("status", currentStatus);
        if (e.target.value) params.set("range", e.target.value);
        const query = params.toString();
        router.push(`/patrollings${query ? `?${query}` : ""}`);
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
  );
}
