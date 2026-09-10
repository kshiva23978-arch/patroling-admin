"use client";

import { useState } from "react";
import { secondaryButtonClass } from "@/lib/ui-classes";
import type { BeachCleaningReportData } from "@/lib/resources/beach-cleaning-activities";

/**
 * Builds the PDF from the report *data* directly (jsPDF text + `autoTable`
 * rows), not by rasterizing the on-screen DOM — a screenshot-based PDF
 * (the previous `html2canvas` approach) embeds one big flattened image, so
 * every number in it is a pixel, not a character: it can't be searched,
 * selected, copied, or read by a screen reader/OCR-adjacent tool. This
 * generates real vector text instead, so the tables are natively
 * selectable/searchable in any PDF viewer. Charts stay screen-only (a plot
 * is inherently a picture either way) — only the two country × category
 * tables are put into the PDF, since that's the data anyone would actually
 * want to copy or search.
 */
export function DownloadPdfButton({
  report,
  destinationName,
  beachName,
  rangerName,
  dateFrom,
  dateTo,
  filename,
}: {
  report: BeachCleaningReportData;
  destinationName?: string;
  beachName?: string;
  rangerName?: string;
  dateFrom?: string;
  dateTo?: string;
  filename: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const download = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 10;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Waste Segregation Report", marginX, 14);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const dateRange = dateFrom || dateTo ? `${dateFrom || "…"} to ${dateTo || "…"}` : "All Dates";
      doc.text(
        `Destination: ${destinationName ?? "All Destinations"}    Beach: ${beachName ?? "All Beaches"}    ` +
          `Ranger: ${rangerName ?? "All Rangers"}    Date Range: ${dateRange}`,
        marginX,
        20,
      );
      doc.text(
        `${report.activity_count} drive${report.activity_count === 1 ? "" : "s"} · ` +
          `Recorded (10% Sample): ${report.grand_total} Nos. (${report.weight_grand_total.toFixed(2)} kg) · ` +
          `Estimated Remaining (~90%): ${report.remaining_grand_total} Nos. (${report.remaining_weight_grand_total.toFixed(2)} kg)`,
        marginX,
        25,
      );

      let cursorY = 30;
      cursorY = addReportTable(doc, autoTable, {
        title: "As Recorded — 10% Sample",
        startY: cursorY,
        marginX,
        pageWidth,
        countries: report.countries,
        categories: report.categories,
        matrix: report.matrix,
        weightMatrix: report.weight_matrix,
        categoryTotals: report.category_totals,
        weightCategoryTotals: report.weight_category_totals,
        totalBags: report.total_bags,
      });

      addReportTable(doc, autoTable, {
        title: "Estimated Remaining — 90%",
        startY: cursorY + 6,
        marginX,
        pageWidth,
        countries: report.countries,
        categories: report.categories,
        matrix: report.remaining_matrix,
        weightMatrix: report.remaining_weight_matrix,
        categoryTotals: report.remaining_category_totals,
        weightCategoryTotals: report.remaining_weight_category_totals,
      });

      doc.save(filename);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button type="button" onClick={download} disabled={isGenerating} className={secondaryButtonClass}>
      {isGenerating ? "Preparing PDF…" : "Download PDF"}
    </button>
  );
}

/** jsPDF's own type import isn't re-exported cleanly from the dynamic-imported module — narrow enough locally instead. */
type JsPdfDoc = InstanceType<typeof import("jspdf").jsPDF>;
type AutoTableFn = typeof import("jspdf-autotable").default;

function addReportTable(
  doc: JsPdfDoc,
  autoTable: AutoTableFn,
  {
    title,
    startY,
    marginX,
    pageWidth,
    countries,
    categories,
    matrix,
    weightMatrix,
    categoryTotals,
    weightCategoryTotals,
    totalBags,
  }: {
    title: string;
    startY: number;
    marginX: number;
    pageWidth: number;
    countries: string[];
    categories: string[];
    matrix: Record<string, Record<string, number>>;
    weightMatrix: Record<string, Record<string, number>>;
    categoryTotals: Record<string, number>;
    weightCategoryTotals: Record<string, number>;
    /** Only the as-recorded table has a real "No. of Bags" total — see `ReportTable`'s own doc comment. */
    totalBags?: number;
  },
): number {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(title, marginX, startY);

  const cell = (nos: number, kg: number) => `${nos}\n${kg.toFixed(2)} kg`;

  const head = [
    ["Sl.\nNo", "Country", ...categories, ...(totalBags !== undefined ? ["No. of\nBags"] : [])],
  ];

  const body = countries.map((country, index) => [
    String(index + 1),
    country,
    ...categories.map((category) => cell(matrix[country]?.[category] ?? 0, weightMatrix[country]?.[category] ?? 0)),
    ...(totalBags !== undefined ? ["0"] : []),
  ]);

  body.push([
    "",
    "TOTAL",
    ...categories.map((category) => cell(categoryTotals[category] ?? 0, weightCategoryTotals[category] ?? 0)),
    ...(totalBags !== undefined ? [String(totalBags)] : []),
  ]);

  const usableWidth = pageWidth - marginX * 2;
  const slNoWidth = 8;
  const countryWidth = 30;
  const bagsWidth = totalBags !== undefined ? 14 : 0;
  const categoryWidth = (usableWidth - slNoWidth - countryWidth - bagsWidth) / categories.length;

  const columnStyles: Record<number, { cellWidth: number; halign?: "left" | "center" }> = {
    0: { cellWidth: slNoWidth, halign: "center" },
    1: { cellWidth: countryWidth },
  };
  categories.forEach((_, i) => {
    columnStyles[i + 2] = { cellWidth: categoryWidth, halign: "center" };
  });
  if (totalBags !== undefined) {
    columnStyles[categories.length + 2] = { cellWidth: bagsWidth, halign: "center" };
  }

  autoTable(doc, {
    head,
    body,
    startY: startY + 2,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 6, cellPadding: 1, lineColor: [220, 220, 220], lineWidth: 0.1, valign: "middle" },
    headStyles: { fillColor: [244, 244, 245], textColor: [39, 39, 42], fontStyle: "bold", halign: "center" },
    bodyStyles: { textColor: [24, 24, 27] },
    // Bold the TOTAL row (last body row) the same way ReportTable highlights it on screen.
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [244, 244, 245];
      }
    },
    columnStyles,
    theme: "grid",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jspdf-autotable attaches this at runtime; not in its public types.
  return (doc as any).lastAutoTable.finalY as number;
}
