"use client";

import { useRouter } from "next/navigation";
import type { Range } from "@/lib/resources/ranges";
import { inputClass } from "@/lib/ui-classes";

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
      className={`${inputClass} max-w-xs`}
      value={currentRangeId ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams();
        if (currentStatus) params.set("status", currentStatus);
        if (e.target.value) params.set("range", e.target.value);
        const query = params.toString();
        router.push(`/case-entries${query ? `?${query}` : ""}`);
      }}
    >
      <option value="">All ranges</option>
      {ranges.map((r) => (
        <option key={r.id} value={r.id}>
          {r.range_name}
        </option>
      ))}
    </select>
  );
}
