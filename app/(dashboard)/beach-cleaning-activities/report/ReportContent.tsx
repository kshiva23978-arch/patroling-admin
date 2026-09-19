"use client";

import { useRef } from "react";
import type { BeachCleaningReportData } from "@/lib/resources/beach-cleaning-activities";
import { cardClass } from "@/lib/ui-classes";
import { ReportTable } from "./ReportTable";
import { ReportCharts, type ReportChartsHandle } from "./ReportCharts";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { DriveWiseSection } from "./DriveWiseSection";

export function ReportContent({
  report,
  destinationName,
  beachName,
  rangerName,
  dateFrom,
  dateTo,
  singleDrive = false,
}: {
  report: BeachCleaningReportData;
  destinationName?: string;
  beachName?: string;
  rangerName?: string;
  dateFrom?: string;
  dateTo?: string;
  /** True on the per-drive report page — the drive-wise card below already shows this one drive's own 10% sample grid, so the generic "As Recorded" table would just repeat it. */
  singleDrive?: boolean;
}) {
  const filenameParts = ["waste-segregation-report", destinationName, beachName, rangerName].filter(Boolean);
  // Multi-selects join names with ", " — collapse anything non-alphanumeric to a dash.
  const filename = `${filenameParts.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.pdf`;
  const chartsRef = useRef<ReportChartsHandle>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <DownloadPdfButton
          report={report}
          destinationName={destinationName}
          beachName={beachName}
          rangerName={rangerName}
          dateFrom={dateFrom}
          dateTo={dateTo}
          filename={filename}
          getChartImages={() => chartsRef.current?.getChartImages() ?? []}
        />
      </div>

      <div className="space-y-4 bg-white p-1">
        <div className={`p-4 ${cardClass}`}>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <SummaryField label="Origin" value={destinationName ?? "All Origins"} />
            <SummaryField label="Beach" value={beachName ?? "All Beaches"} />
            <SummaryField label="Division" value={rangerName ?? "All Divisions"} />
            <SummaryField label="Date Range" value={dateFrom || dateTo ? `${dateFrom || "…"} to ${dateTo || "…"}` : "All Dates"} />
          </dl>
        </div>

        <div className={`p-4 ${cardClass}`}>
          <h2 className="text-sm font-semibold text-zinc-900">Recorded Sample vs. Estimated Remaining</h2>
          <p className="mt-1 text-xs text-zinc-500">
            The tables below only ever cover the recorded 10% sample lot — the second one estimates the other ~90%
            that was never individually sorted/counted, scaled up per each drive&rsquo;s own recorded sample rate.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <SummaryField label="Recorded" value={`${report.weight_grand_total.toFixed(2)} kg`} />
            <SummaryField
              label="Estimated Remaining (~90%)"
              value={`${report.remaining_weight_grand_total.toFixed(2)} kg`}
            />
            <SummaryField label="No. of Bags" value={String(report.total_bags)} />
            <SummaryField label="Overall Weight" value={`${report.total_weight_kg.toFixed(2)} kg`} />
          </dl>
        </div>

        <DriveWiseSection activities={report.activities} countries={report.countries} categories={report.categories} />

        {!singleDrive && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">As Recorded — 10% Sample</h2>
            <ReportTable
              countries={report.countries}
              categories={report.categories}
              matrix={report.matrix}
              categoryTotals={report.category_totals}
              grandTotal={report.grand_total}
              weightMatrix={report.weight_matrix}
              weightCategoryTotals={report.weight_category_totals}
              weightGrandTotal={report.weight_grand_total}
              totalBags={report.total_bags}
              activityCount={report.activity_count}
            />
          </div>
        )}

        {!singleDrive && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">Estimated Remaining — 90%</h2>
            <ReportTable
              countries={report.countries}
              categories={report.categories}
              matrix={report.remaining_matrix}
              categoryTotals={report.remaining_category_totals}
              grandTotal={report.remaining_grand_total}
              weightMatrix={report.remaining_weight_matrix}
              weightCategoryTotals={report.remaining_weight_category_totals}
              weightGrandTotal={report.remaining_weight_grand_total}
              activityCount={report.activity_count}
            />
          </div>
        )}

        <ReportCharts ref={chartsRef} report={report} />
      </div>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-900">{value}</dd>
    </div>
  );
}
