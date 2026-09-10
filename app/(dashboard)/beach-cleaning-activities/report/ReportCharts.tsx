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
 * coming from), a pie chart of category-wise totals (which waste types
 * dominate), and a stacked bar breaking each country down by category (the
 * chart form of [ReportTable]'s own matrix, at a glance) — all drawn from
 * the same fixed report data as [ReportTable], so they always agree with
 * it. Screen-only — `DownloadPdfButton` builds the PDF from the report data
 * directly (real text tables, not a screenshot), so these charts aren't
 * captured into it; a plotted chart is inherently a picture either way.
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

  // One dataset per waste category, each contributing that category's
  // count for every country — stacking them turns the report's country ×
  // category matrix into a single readable chart instead of 9 separate bars
  // per country.
  const countryByCategoryData = useMemo(
    () => ({
      labels: report.countries,
      datasets: report.categories.map((category, i) => ({
        label: category,
        data: report.countries.map((country) => report.matrix[country]?.[category] ?? 0),
        backgroundColor: colorFor(i),
      })),
    }),
    [report],
  );

  return (
    <div className="space-y-4">
      <div className={`space-y-3 p-4 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-zinc-900">Country-Wise Category Collection</h2>
        <div className="h-96">
          <Bar
            data={countryByCategoryData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 10 } } } },
              scales: {
                x: { stacked: true, ticks: { autoSkip: false, maxRotation: 90, minRotation: 60 } },
                y: { stacked: true },
              },
            }}
          />
        </div>
      </div>

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
    </div>
  );
}
