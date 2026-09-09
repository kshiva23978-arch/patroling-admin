"use client";

import { useRef } from "react";
import type { BeachCleaningReportData } from "@/lib/resources/beach-cleaning-activities";
import { cardClass } from "@/lib/ui-classes";
import { ReportTable } from "./ReportTable";
import { ReportCharts } from "./ReportCharts";
import { DownloadPdfButton } from "./DownloadPdfButton";

/**
 * Owns the ref [DownloadPdfButton] captures — everything inside it (the
 * summary header, fixed table, and both charts) ends up in the downloaded
 * PDF, exactly as shown on screen.
 */
export function ReportContent({
  report,
  destinationName,
  beachName,
  rangerName,
  dateFrom,
  dateTo,
}: {
  report: BeachCleaningReportData;
  destinationName?: string;
  beachName?: string;
  rangerName?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  const filenameParts = ["waste-segregation-report", destinationName, beachName, rangerName].filter(Boolean);
  const filename = `${filenameParts.join("-").toLowerCase().replace(/\s+/g, "-")}.pdf`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <DownloadPdfButton targetRef={contentRef} filename={filename} />
      </div>

      <div ref={contentRef} className="space-y-4 bg-white p-1">
        <div className={`p-4 ${cardClass}`}>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <SummaryField label="Destination" value={destinationName ?? "All Destinations"} />
            <SummaryField label="Beach" value={beachName ?? "All Beaches"} />
            <SummaryField label="Ranger" value={rangerName ?? "All Rangers"} />
            <SummaryField label="Date Range" value={dateFrom || dateTo ? `${dateFrom || "…"} to ${dateTo || "…"}` : "All Dates"} />
          </dl>
        </div>

        <div className={`p-4 ${cardClass}`}>
          <h2 className="text-sm font-semibold text-zinc-900">Recorded Sample vs. Estimated Full Collection</h2>
          <p className="mt-1 text-xs text-zinc-500">
            The table below only ever covers the recorded 10% sample lot — these figures scale it up to estimate the
            full collection, per drive's own recorded sample rate.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <SummaryField label="Recorded (10% Sample)" value={`${report.grand_total} Nos.`} />
            <SummaryField label="Estimated Remaining (~90%)" value={`${(report.estimated_grand_total - report.grand_total).toFixed(2)} Nos.`} />
            <SummaryField label="Estimated Full Collection (100%)" value={`${report.estimated_grand_total} Nos.`} />
          </dl>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">As Recorded — 10% Sample</h2>
          <ReportTable
            countries={report.countries}
            categories={report.categories}
            matrix={report.matrix}
            categoryTotals={report.category_totals}
            grandTotal={report.grand_total}
            totalBags={report.total_bags}
            activityCount={report.activity_count}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Estimated Full Collection — 100%</h2>
          <ReportTable
            countries={report.countries}
            categories={report.categories}
            matrix={report.estimated_matrix}
            categoryTotals={report.estimated_category_totals}
            grandTotal={report.estimated_grand_total}
            activityCount={report.activity_count}
          />
        </div>

        <ReportCharts report={report} />
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
