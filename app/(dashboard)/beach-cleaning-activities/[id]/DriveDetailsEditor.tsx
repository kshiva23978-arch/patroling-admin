"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { BeachCleaningActivity } from "@/lib/resources/beach-cleaning-activities";
import { errorTextClass, inputClass, labelClass, linkButtonClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui-classes";
import { updateBeachCleaningActivityAction } from "./actions";

/** Inline "Edit" toggle for the two Drive Details fields an admin can correct — officer name and the drive's overall recorded weight. */
export function DriveDetailsEditor({ activity }: { activity: BeachCleaningActivity }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [officerName, setOfficerName] = useState(activity.officer_name ?? "");
  const [totalWeightKg, setTotalWeightKg] = useState(activity.total_weight_kg?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();

  if (!editing) {
    return (
      <button type="button" className={linkButtonClass} onClick={() => setEditing(true)}>
        Edit Details
      </button>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors(undefined);
    startTransition(async () => {
      const result = await updateBeachCleaningActivityAction(activity.id, {
        officerName,
        totalWeightKg: totalWeightKg.trim() === "" ? null : Number(totalWeightKg),
      });
      if (!result.success) {
        setError(result.message);
        setFieldErrors(result.fieldErrors);
        return;
      }
      toast.success("Drive details updated.");
      setEditing(false);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      {error && <p className={errorTextClass}>{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Officer / Point of Contact</label>
          <input
            className={inputClass}
            value={officerName}
            disabled={isPending}
            onChange={(e) => setOfficerName(e.target.value)}
          />
          {fieldErrors?.officerName && <p className={errorTextClass}>{fieldErrors.officerName[0]}</p>}
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Total Weight (kg)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            value={totalWeightKg}
            disabled={isPending}
            onChange={(e) => setTotalWeightKg(e.target.value)}
          />
          {fieldErrors?.totalWeightKg && <p className={errorTextClass}>{fieldErrors.totalWeightKg[0]}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={primaryButtonClass} disabled={isPending || !officerName.trim()}>
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={isPending}
          onClick={() => {
            setEditing(false);
            setOfficerName(activity.officer_name ?? "");
            setTotalWeightKg(activity.total_weight_kg?.toString() ?? "");
            setError(null);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
