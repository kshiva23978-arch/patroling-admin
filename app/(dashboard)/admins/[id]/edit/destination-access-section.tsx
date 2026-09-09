"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Destination } from "@/lib/resources/destinations";
import { inputClass, primaryButtonClass, dangerButtonClass } from "@/lib/ui-classes";
import { grantAdminDestinationAccessAction, revokeAdminDestinationAccessAction } from "../../actions";

interface DestinationAccessSectionProps {
  adminId: string;
  assignedDestinations: Destination[];
  allDestinations: Destination[];
}

/**
 * Which destination(s) this admin is scoped to — only meaningful for a role
 * at `department_admin` or `ranger` level (see
 * `Admin::accessibleDestinationIds`); assigning destinations to a Master
 * Admin is harmless but has no effect, since that level is unrestricted
 * regardless.
 */
export function DestinationAccessSection({ adminId, assignedDestinations, allDestinations }: DestinationAccessSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");
  const assignedIds = new Set(assignedDestinations.map((d) => d.id));
  const available = allDestinations.filter((d) => !assignedIds.has(d.id));

  const handleGrant = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await grantAdminDestinationAccessAction(adminId, selected);
      if (result.success) {
        toast.success("Destination access granted.");
        setSelected("");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleRevoke = (destinationId: string) => {
    if (!window.confirm("Remove access to this destination?")) return;
    startTransition(async () => {
      const result = await revokeAdminDestinationAccessAction(adminId, destinationId);
      if (result.success) {
        toast.success("Destination access removed.");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-zinc-100">
        {assignedDestinations.length === 0 && <li className="py-2 text-sm text-zinc-500">No destinations assigned.</li>}
        {assignedDestinations.map((d) => (
          <li key={d.id} className="flex items-center justify-between py-2">
            <span className="text-sm text-zinc-700">{d.name}</span>
            <button type="button" className={dangerButtonClass} disabled={isPending} onClick={() => handleRevoke(d.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-medium text-zinc-500">Grant access to destination</label>
          <select className={inputClass} value={selected} onChange={(e) => setSelected(e.target.value)} disabled={isPending}>
            <option value="">Select a destination…</option>
            {available.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
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
