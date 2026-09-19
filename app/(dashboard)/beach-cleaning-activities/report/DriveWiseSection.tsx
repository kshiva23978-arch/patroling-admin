"use client";

import type { ReactNode } from "react";
import type {
  BeachCleaningActivity,
  BeachCleaningMediaRef,
  BeachCleaningOfficerRef,
  BeachCleaningReportRow,
} from "@/lib/resources/beach-cleaning-activities";
import { cardClass, badgeClass } from "@/lib/ui-classes";
import { PhotoGrid } from "@/components/media/PhotoLightbox";

const MEDIA_BASE_URL = "/api/beach-cleaning-media";

/** One card per matching drive, in the same shape as the drive detail page — division, date, participants, collected totals, per-drive segregation tables, the beach's assigned officer, then photos. */
export function DriveWiseSection({ activities }: { activities: BeachCleaningActivity[] }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Drive-wise Details ({activities.length})</h2>
        <p className="text-xs text-zinc-500">Every drive matching the filters above, one card each.</p>
      </div>
      {activities.length === 0 ? (
        <div className={`p-4 text-sm text-zinc-400 ${cardClass}`}>No drives match the current filters.</div>
      ) : (
        activities.map((activity) => <DriveCard key={activity.id} activity={activity} />)
      )}
    </div>
  );
}

function DriveCard({ activity }: { activity: BeachCleaningActivity }) {
  const beforePhotos = activity.media.filter((m) => m.kind === "before");
  const collectionPhotos = activity.media.filter((m) => m.kind === "collection");
  const otherPhotos = activity.media.filter((m) => m.kind === "other");

  return (
    <div className={`space-y-4 p-4 ${cardClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            {activity.beach?.name ?? "—"}
            {activity.destination?.name ? (
              <span className="font-normal text-zinc-500"> &middot; {activity.destination.name}</span>
            ) : null}
          </h3>
          <p className="text-xs text-zinc-500">{activity.activity_name}</p>
        </div>
        <span className={badgeClass(activity.status === "submitted")}>
          {activity.status === "submitted" ? "Submitted" : "In Progress"}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        <Field label="Division" value={officerLabel(activity.officer)} />
        <Field
          label="Date"
          value={
            activity.created_at
              ? new Date(activity.created_at).toLocaleDateString([], { dateStyle: "medium", timeZone: "Asia/Kolkata" })
              : "—"
          }
        />
        <Field label="Participants" value={activity.participant_count ?? "—"} />
        <Field
          label="Total Collected"
          value={`${activity.bags_collected ?? 0} bags${
            activity.total_weight_kg !== null ? ` · ${activity.total_weight_kg.toFixed(1)} kg` : ""
          }`}
        />
        <Field label="Beach Officer" value={activity.beach?.officer_name || "—"} />
      </dl>

      <p className="text-xs font-medium text-zinc-500">Segregation — 10% Sample Collection</p>
      <div className="grid gap-3 lg:grid-cols-2">
        <CategoryTable
          rows={activity.report?.by_category ?? []}
          weightRows={activity.report?.by_category_weight ?? []}
        />
        <MiniTable title="Origin-Wise Collection" rows={activity.report?.by_country ?? []} unit="No.s" />
      </div>

      <div className="space-y-3">
        <PhotoBlock title={`Before Photos (${beforePhotos.length})`} items={beforePhotos} empty="No before photo captured." />
        <PhotoBlock title={`Collection Photos (${collectionPhotos.length})`} items={collectionPhotos} empty="No collection photo captured." />
        <PhotoBlock title={`Other Photos (${otherPhotos.length})`} items={otherPhotos} empty="No other photos captured." />
      </div>
    </div>
  );
}

function officerLabel(officer: BeachCleaningOfficerRef | null): string {
  if (!officer) return "—";
  return officer.name ? `${officer.name} (${officer.employee_id})` : officer.employee_id;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-900">{value}</dd>
    </div>
  );
}

/** "Waste By Category" and "Category-Wise Weight" share the same category rows — merged into one Category | No.s | Weight table instead of two side by side. */
function CategoryTable({ rows, weightRows }: { rows: BeachCleaningReportRow[]; weightRows: BeachCleaningReportRow[] }) {
  const weightByName = new Map(weightRows.map((r) => [r.name, r.quantity_kg]));
  const totalNos = rows.reduce((sum, r) => sum + r.quantity_kg, 0);
  const totalWeight = weightRows.reduce((sum, r) => sum + r.quantity_kg, 0);

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 p-3">
      <h4 className="text-xs font-semibold text-zinc-900">Waste By Category</h4>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-400">No data recorded.</p>
      ) : (
        <table className="min-w-full divide-y divide-zinc-100 text-xs">
          <thead>
            <tr>
              <th className="py-1 pr-3 text-left font-medium text-zinc-500">Category</th>
              <th className="py-1 pr-3 text-right font-medium text-zinc-500">No.s</th>
              <th className="py-1 text-right font-medium text-zinc-500">Weight (kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="py-1 pr-3 text-zinc-700">{row.name}</td>
                <td className="py-1 pr-3 text-right font-medium text-zinc-900">{row.quantity_kg} No.s</td>
                <td className="py-1 text-right font-medium text-zinc-900">
                  {(weightByName.get(row.name) ?? 0).toFixed(1)} kg
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200">
              <td className="py-1 pr-3 text-right font-semibold text-zinc-900">Total</td>
              <td className="py-1 pr-3 text-right font-semibold text-zinc-900">{totalNos} No.s</td>
              <td className="py-1 text-right font-semibold text-zinc-900">{totalWeight.toFixed(1)} kg</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

function MiniTable({ title, rows, unit }: { title: string; rows: BeachCleaningReportRow[]; unit: string }) {
  const total = rows.reduce((sum, r) => sum + r.quantity_kg, 0);
  return (
    <div className="space-y-2 rounded-md border border-zinc-200 p-3">
      <h4 className="text-xs font-semibold text-zinc-900">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-400">No data recorded.</p>
      ) : (
        <table className="min-w-full divide-y divide-zinc-100 text-xs">
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="py-1 pr-3 text-zinc-700">{row.name}</td>
                <td className="py-1 text-right font-medium text-zinc-900">
                  {row.quantity_kg} {unit}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200">
              <td className="py-1 pr-3 text-right font-semibold text-zinc-900">Total</td>
              <td className="py-1 text-right font-semibold text-zinc-900">
                {total} {unit}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

function PhotoBlock({ title, items, empty }: { title: string; items: BeachCleaningMediaRef[]; empty: string }) {
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold text-zinc-900">{title}</h4>
      <PhotoGrid items={items} baseUrl={MEDIA_BASE_URL} emptyMessage={empty} />
    </div>
  );
}
