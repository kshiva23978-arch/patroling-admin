"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import type { BeachCleaningReportData } from "@/lib/resources/beach-cleaning-activities";
import { cardClass } from "@/lib/ui-classes";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

/** A fixed, readable palette — deterministic across renders, not randomly generated. */
const PALETTE = [
  "#0d9488", "#2563eb", "#d97706", "#dc2626", "#7c3aed",
  "#059669", "#db2777", "#4b5563", "#0891b2", "#ca8a04",
];

function colorFor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

/**
 * Bar chart of country-wise totals (which origin countries the litter is
 * coming from) and a pie chart of category-wise totals (which waste types
 * dominate) — both drawn from the same fixed report data as [ReportTable],
 * so they always agree with it. Canvas-based (Chart.js), deliberately —
 * `DownloadPdfButton`'s `html2canvas` capture is far more reliable against
 * a `<canvas>` than an SVG chart.
 */
export function ReportCharts({ report }: { report: BeachCleaningReportData }) {
  const countryData = useMemo(
    () => ({
      labels: report.countries,
      datasets: [
        {
          label: "Total (Nos.)",
          data: report.countries.map((c) => report.country_totals[c] ?? 0),
          backgroundColor: colorFor(0),
        },
      ],
    }),
    [report],
  );

  const categoryData = useMemo(
    () => ({
      labels: report.categories,
      datasets: [
        {
          label: "Total (Nos.)",
          data: report.categories.map((c) => report.category_totals[c] ?? 0),
          backgroundColor: report.categories.map((_, i) => colorFor(i)),
        },
      ],
    }),
    [report],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={`space-y-3 p-4 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-zinc-900">Country-Wise Total</h2>
        <div className="h-80">
          <Bar
            data={countryData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { x: { ticks: { autoSkip: false, maxRotation: 90, minRotation: 60 } } },
            }}
          />
        </div>
      </div>

      <div className={`space-y-3 p-4 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-zinc-900">Category-Wise Distribution</h2>
        <div className="h-80">
          <Pie
            data={categoryData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "right", labels: { boxWidth: 12, font: { size: 10 } } } },
            }}
          />
        </div>
      </div>
    </div>
  );
}
