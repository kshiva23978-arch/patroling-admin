"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Range } from "@/lib/resources/ranges";
import { inputClass, primaryButtonClass, dangerButtonClass } from "@/lib/ui-classes";
import { grantRangeAccessAction, revokeRangeAccessAction } from "../../actions";

interface RangeAccessSectionProps {
  userId: string;
  assignedRanges: Range[];
  allRanges: Range[];
}

export function RangeAccessSection({ userId, assignedRanges, allRanges }: RangeAccessSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");
  const assignedIds = new Set(assignedRanges.map((r) => r.id));
  const available = allRanges.filter((r) => !assignedIds.has(r.id));

  const handleGrant = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await grantRangeAccessAction(userId, selected);
      if (result.success) {
        toast.success("Range access granted.");
        setSelected("");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleRevoke = (rangeId: string) => {
    if (!window.confirm("Remove access to this range?")) return;
    startTransition(async () => {
      const result = await revokeRangeAccessAction(userId, rangeId);
      if (result.success) {
        toast.success("Range access removed.");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-zinc-100">
        {assignedRanges.length === 0 && <li className="py-2 text-sm text-zinc-500">No ranges assigned.</li>}
        {assignedRanges.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-2">
            <span className="text-sm text-zinc-700">{r.range_name}</span>
            <button type="button" className={dangerButtonClass} disabled={isPending} onClick={() => handleRevoke(r.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-medium text-zinc-500">Grant access to range</label>
          <select className={inputClass} value={selected} onChange={(e) => setSelected(e.target.value)} disabled={isPending}>
            <option value="">Select a range…</option>
            {available.map((r) => (
              <option key={r.id} value={r.id}>
                {r.range_name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className={primaryButtonClass} disabled={isPending || !selected} onClick={handleGrant}>
          Grant
        </button>
      </div>
    </div>
  );
}
