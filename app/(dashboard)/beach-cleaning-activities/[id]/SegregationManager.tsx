"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { BeachCleaningRefShape, BeachCleaningSegregationRef } from "@/lib/resources/beach-cleaning-activities";
import { beachCleaningSegregationDefaults, type BeachCleaningSegregationInput } from "@/lib/schemas/beach-cleaning-activities";
import type { ActionResult } from "@/lib/action-result";
import { cardClass, dangerButtonClass, errorTextClass, inputClass, labelClass, linkButtonClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui-classes";
import {
  addBeachCleaningSegregationAction,
  removeBeachCleaningSegregationAction,
  updateBeachCleaningSegregationAction,
} from "./actions";

function toFormInput(row: BeachCleaningSegregationRef): BeachCleaningSegregationInput {
  return {
    countryId: row.country?.id ?? "",
    wasteCategoryId: row.waste_category?.id ?? "",
    quantityKg: row.quantity_kg,
    weightKg: row.weight_kg,
  };
}

/**
 * Admin-only manager for a drive's origin/category collection rows — the raw
 * data the read-only "Origin-Wise Collection"/"Category-Wise Weight" report
 * tables above are computed from. Same fields as the app's own step-4 "+ Add
 * More" sheet, plus in-place editing, which the app itself never offers a
 * ranger (only add/remove).
 */
export function SegregationManager({
  activityId,
  segregations,
  countries,
  wasteCategories,
}: {
  activityId: string;
  segregations: BeachCleaningSegregationRef[];
  countries: BeachCleaningRefShape[];
  wasteCategories: BeachCleaningRefShape[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const handleDelete = (row: BeachCleaningSegregationRef) => {
    const label = `${row.country?.name ?? "Unknown origin"} / ${row.waste_category?.name ?? "Unknown category"}`;
    if (!window.confirm(`Remove the collection row "${label}"?`)) return;
    startTransition(async () => {
      const result = await removeBeachCleaningSegregationAction(activityId, row.id);
      if (result.success) {
        toast.success("Collection row removed.");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className={`space-y-3 p-4 ${cardClass}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Collections by Origin &amp; Category</h2>
        {!showNewForm && (
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => {
              setEditingId(null);
              setShowNewForm(true);
            }}
          >
            Add Row
          </button>
        )}
      </div>

      {showNewForm && (
        <SegregationForm
          key="new"
          defaultValues={beachCleaningSegregationDefaults}
          countries={countries}
          wasteCategories={wasteCategories}
          onCancel={() => setShowNewForm(false)}
          onSubmit={(values) => addBeachCleaningSegregationAction(activityId, values)}
          onSaved={() => setShowNewForm(false)}
          submitLabel="Add Row"
        />
      )}

      <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
        {segregations.length === 0 && !showNewForm && (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">No collection rows recorded.</p>
        )}

        {segregations.map((row) =>
          editingId === row.id ? (
            <div key={row.id} className="bg-zinc-50 p-4">
              <SegregationForm
                defaultValues={toFormInput(row)}
                countries={countries}
                wasteCategories={wasteCategories}
                onCancel={() => setEditingId(null)}
                onSubmit={(values) => updateBeachCleaningSegregationAction(activityId, row.id, values)}
                onSaved={() => setEditingId(null)}
                submitLabel="Save Changes"
              />
            </div>
          ) : (
            <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 text-sm">
                <span className="font-medium text-zinc-900">{row.country?.name ?? "Unspecified origin"}</span>
                <span className="text-zinc-400"> &middot; </span>
                <span className="text-zinc-700">{row.waste_category?.name ?? "Uncategorized"}</span>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {row.quantity_kg} No.s{row.weight_kg !== null && ` — ${row.weight_kg} kg`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className={linkButtonClass}
                  disabled={isPending}
                  onClick={() => {
                    setShowNewForm(false);
                    setEditingId(row.id);
                  }}
                >
                  Edit
                </button>
                <button type="button" className={dangerButtonClass} disabled={isPending} onClick={() => handleDelete(row)}>
                  Remove
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function SegregationForm({
  defaultValues,
  countries,
  wasteCategories,
  onSubmit,
  onSaved,
  onCancel,
  submitLabel,
}: {
  defaultValues: BeachCleaningSegregationInput;
  countries: BeachCleaningRefShape[];
  wasteCategories: BeachCleaningRefShape[];
  onSubmit: (values: BeachCleaningSegregationInput) => Promise<ActionResult>;
  onSaved: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [countryId, setCountryId] = useState(defaultValues.countryId);
  const [wasteCategoryId, setWasteCategoryId] = useState(defaultValues.wasteCategoryId);
  const [quantityKg, setQuantityKg] = useState(defaultValues.quantityKg ? String(defaultValues.quantityKg) : "");
  const [weightKg, setWeightKg] = useState(defaultValues.weightKg !== null ? String(defaultValues.weightKg) : "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors(undefined);
    startTransition(async () => {
      const result = await onSubmit({
        countryId,
        wasteCategoryId,
        quantityKg: Number(quantityKg),
        weightKg: weightKg.trim() === "" ? null : Number(weightKg),
      });
      if (!result.success) {
        setError(result.message ?? "Something went wrong.");
        setFieldErrors(result.fieldErrors);
        return;
      }
      toast.success("Saved.");
      onSaved();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-zinc-200 p-4">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Origin</label>
          <select className={inputClass} value={countryId} disabled={isPending} onChange={(e) => setCountryId(e.target.value)}>
            <option value="" disabled>
              Select an origin
            </option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldErrors?.countryId && <p className={errorTextClass}>{fieldErrors.countryId[0]}</p>}
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Category</label>
          <select
            className={inputClass}
            value={wasteCategoryId}
            disabled={isPending}
            onChange={(e) => setWasteCategoryId(e.target.value)}
          >
            <option value="" disabled>
              Select a category
            </option>
            {wasteCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldErrors?.wasteCategoryId && <p className={errorTextClass}>{fieldErrors.wasteCategoryId[0]}</p>}
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Quantity (No.s)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={inputClass}
            value={quantityKg}
            disabled={isPending}
            onChange={(e) => setQuantityKg(e.target.value)}
          />
          {fieldErrors?.quantityKg && <p className={errorTextClass}>{fieldErrors.quantityKg[0]}</p>}
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Weight (kg, optional)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={inputClass}
            value={weightKg}
            disabled={isPending}
            onChange={(e) => setWeightKg(e.target.value)}
          />
          {fieldErrors?.weightKg && <p className={errorTextClass}>{fieldErrors.weightKg[0]}</p>}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className={primaryButtonClass}
          disabled={isPending || !countryId || !wasteCategoryId || !quantityKg}
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
        <button type="button" className={secondaryButtonClass} disabled={isPending} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
