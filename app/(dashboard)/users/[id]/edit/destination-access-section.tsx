"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Destination } from "@/lib/resources/destinations";
import { inputClass, primaryButtonClass, dangerButtonClass } from "@/lib/ui-classes";
import { grantDestinationAccessAction, revokeDestinationAccessAction } from "../../actions";

interface DestinationAccessSectionProps {
    userId: string;
    assignedDestinations: Destination[];
    allDestinations: Destination[];
}

export function DestinationAccessSection({ userId, assignedDestinations, allDestinations }: DestinationAccessSectionProps) {
    const [isPending, startTransaction] = useTransition();
    const [selected, setSelected] = useState("");
    const assignedIds = new Set(assignedDestinations.map((r) => r.id));
    const available = allDestinations.filter((r) => !assignedIds.has(r.id));

    const handleGrant = () => {
        if (!selected) return;
        startTransaction(async () => {
            const result = await grantDestinationAccessAction(userId, selected);
            if (result.success) {
                toast.success("Destination access granted");
                setSelected("");
            } else {
                toast.error(result.message);
            }
        });
    };

    const handleRevoke = (destinationId: string) => {
        if (!window.confirm("Remove access to this destination?")) return;
        startTransaction(async () => {
            const result = await revokeDestinationAccessAction(userId, destinationId);
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
                {assignedDestinations.length === 0 && <li className="py-2 text-sm text-zinc-500">No destination assigned.</li>}
                {assignedDestinations.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2">
                        <span className="text-sm text-zinc-700">{r.name}</span>
                        <button type="button" className={dangerButtonClass} disabled={isPending} onClick={() => handleRevoke(r.id)} >
                            Remove
                        </button>
                    </li>
                ))}
            </ul>


            <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                    <label className="block text-xs font-medium text-zinc-500">Grant access to destination</label>
                    <select className={inputClass} value={selected} onChange={(e) => setSelected(e.target.value)} disabled={isPending}>
                        <option value="">Select a destination...</option>
                        {available.map((r) => (
                            <option value={r.id} key={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
                <button type="button" className={primaryButtonClass} disabled={isPending || !selected} onClick={handleGrant}>
                    Grant
                </button>
            </div>


        </div>
   )
}