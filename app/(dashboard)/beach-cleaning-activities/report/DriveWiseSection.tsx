"use client";

import type { ReactNode } from "react";
import type { BeachCleaningActivity, BeachCleaningMediaRef } from "@/lib/resources/beach-cleaning-activities";
import { cardClass, badgeClass } from "@/lib/ui-classes";
import { PhotoGrid } from "@/components/media/PhotoLightbox";
import { buildDriveSegregationGrid, officerLabel, MEDIA_BASE_URL } from "./driveSegregation";

/** One card per matching drive, in the same shape as the drive detail page — division, date, participants, collected totals, per-drive segregation grid, the beach's assigned officer, then photos. */
export function DriveWiseSection({
  activities,
  countries,
  categories,
}: {
  activities: BeachCleaningActivity[];
  countries: string[];
  categories: string[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Drive-wise Details ({activities.length})</h2>
        <p className="text-xs text-zinc-500">Every drive matching the filters above, one card each.</p>
      </div>
      {activities.length === 0 ? (
        <div className={`p-4 text-sm text-zinc-400 ${cardClass}`}>No drives match the current filters.</div>
      ) : (
        activities.map((activity) => (
          <DriveCard key={activity.id} activity={activity} countries={countries} categories={categories} />
        ))
      )}
    </div>
  );
}

function DriveCard({
  activity,
  countries,
  categories,
}: {
  activity: BeachCleaningActivity;
  countries: string[];
  categories: string[];
}) {
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
        <Field label="Beach Officer" value={activity.officer_name || activity.beach?.officer_name || "—"} />
      </dl>

      <p className="text-xs font-medium text-zinc-500">Segregation — 10% Sample Collection</p>
      <DriveSegregationTable activity={activity} countries={countries} categories={categories} />

      <div className="space-y-3">
        <PhotoBlock title={`Before Photos (${beforePhotos.length})`} items={beforePhotos} empty="No before photo captured." />
        <PhotoBlock title={`Collection Photos (${collectionPhotos.length})`} items={collectionPhotos} empty="No collection photo captured." />
        <PhotoBlock title={`Other Photos (${otherPhotos.length})`} items={otherPhotos} empty="No other photos captured." />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-900">{value}</dd>
    </div>
  );
}

/**
 * Same fixed origin x category grid shape as the main report's `ReportTable`
 * (every country row, every category column), but scoped to just this one
 * drive's own `segregations`, kg-only per cell, and a row-wise kg total in
 * place of the aggregate table's "No. of Bags" column — bags aren't recorded
 * per origin, so a per-row total is the more meaningful number here.
 */
function DriveSegregationTable({
  activity,
  countries,
  categories,
}: {
  activity: BeachCleaningActivity;
  countries: string[];
  categories: string[];
}) {
  const { recordedCountries, recordedCategories, matrix, categoryTotals } = buildDriveSegregationGrid(
    activity,
    countries,
    categories,
  );

  if (recordedCountries.length === 0) {
    return <p className="text-xs text-zinc-400">No segregation data recorded for this drive.</p>;
  }

  const rowTotal = (country: string) => recordedCategories.reduce((sum, category) => sum + matrix[country][category], 0);
  const grandTotal = recordedCategories.reduce((sum, category) => sum + categoryTotals[category], 0);

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr className="bg-zinc-50">
            <th rowSpan={2} className={headerCellClass + " w-12"}>
              Sl. No
            </th>
            <th rowSpan={2} className={headerCellClass + " min-w-[110px] text-left"}>
              Origin
            </th>
            {recordedCategories.map((category) => (
              <th key={category} className={categoryHeaderCellClass}>
                {category}
              </th>
            ))}
            <th rowSpan={2} className={headerCellClass + " min-w-[80px]"}>
              Total
            </th>
          </tr>
          <tr className="bg-zinc-50">
            {recordedCategories.map((category) => (
              <th key={category} className={headerCellClass + " whitespace-nowrap font-normal text-zinc-500"}>
                kg
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recordedCountries.map((country, index) => (
            <tr key={country} className={index % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
              <td className={cellClass + " text-center text-zinc-500"}>{index + 1}</td>
              <td className={cellClass + " text-zinc-900"}>{country}</td>
              {recordedCategories.map((category) => (
                <td key={category} className={categoryCellClass + " text-right text-zinc-900"}>
                  {matrix[country][category].toFixed(2)} kg
                </td>
              ))}
              <td className={cellClass + " text-right font-medium text-zinc-900"}>{rowTotal(country).toFixed(2)} kg</td>
            </tr>
          ))}
          <tr className="bg-zinc-100 font-semibold text-zinc-900">
            <td className={cellClass}></td>
            <td className={cellClass}>TOTAL</td>
            {recordedCategories.map((category) => (
              <td key={category} className={categoryCellClass + " text-right"}>
                {categoryTotals[category].toFixed(2)} kg
              </td>
            ))}
            <td className={cellClass + " text-right"}>{grandTotal.toFixed(2)} kg</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const headerCellClass = "border border-zinc-200 px-2 py-1.5 text-center font-semibold text-zinc-700 whitespace-nowrap";
const categoryHeaderCellClass =
  "border border-zinc-200 px-1 py-1.5 w-16 max-w-[64px] text-center align-bottom text-[10px] font-semibold leading-tight break-words text-zinc-700";
const cellClass = "border border-zinc-200 px-2 py-1";
const categoryCellClass = "border border-zinc-200 px-1 py-1 w-16 max-w-[64px]";

function PhotoBlock({ title, items, empty }: { title: string; items: BeachCleaningMediaRef[]; empty: string }) {
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold text-zinc-900">{title}</h4>
      <PhotoGrid items={items} baseUrl={MEDIA_BASE_URL} emptyMessage={empty} />
    </div>
  );
}
