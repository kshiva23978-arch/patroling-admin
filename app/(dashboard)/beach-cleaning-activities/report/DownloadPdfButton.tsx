"use client";

import { useState } from "react";
import { secondaryButtonClass } from "@/lib/ui-classes";
import type {
  BeachCleaningActivity,
  BeachCleaningMediaRef,
  BeachCleaningReportData,
} from "@/lib/resources/beach-cleaning-activities";
import type { ReportChartImage } from "./ReportCharts";
import { buildDriveSegregationGrid, officerLabel, MEDIA_BASE_URL } from "./driveSegregation";

/**
 * Builds the PDF from the report *data* directly (jsPDF text + `autoTable`
 * rows) rather than by rasterizing the on-screen DOM — a screenshot-based
 * PDF (the previous `html2canvas` approach) embeds one big flattened image,
 * so every number in it is a pixel, not a character: it can't be searched,
 * selected, copied, or read by a screen reader/OCR-adjacent tool. This
 * generates real vector text for both tables instead, so they're natively
 * selectable/searchable in any PDF viewer. Charts are the one exception —
 * a plotted chart is inherently a picture either way — so [getChartImages]
 * supplies PNG snapshots (via each Chart.js canvas's own `toBase64Image()`,
 * not a DOM screenshot) that get added as their own page each, after the
 * two tables. Drive photos are also inherently pictures, fetched at
 * download time through the same authenticated proxy the on-screen
 * `PhotoGrid` uses.
 */
export function DownloadPdfButton({
  report,
  destinationName,
  beachName,
  rangerName,
  dateFrom,
  dateTo,
  filename,
  getChartImages,
  singleDrive = false,
}: {
  report: BeachCleaningReportData;
  destinationName?: string;
  beachName?: string;
  rangerName?: string;
  dateFrom?: string;
  dateTo?: string;
  filename: string;
  /** Called at download time — see `ReportChartsHandle.getChartImages`. */
  getChartImages: () => ReportChartImage[];
  /** True on the per-drive report page — skips the two generic full-grid tables, same as the on-screen `ReportContent`. */
  singleDrive?: boolean;
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
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 10;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Waste Segregation Report", marginX, 14);

      const dateRange = dateFrom || dateTo ? `${dateFrom || "…"} to ${dateTo || "…"}` : "All Dates";

      // Two small label/value tables, same shape as the on-screen summary
      // cards — light-bordered `autoTable` grids instead of loose `doc.text`
      // lines, so the header info reads as an organized table, not a run-on
      // sentence.
      autoTable(doc, {
        startY: 20,
        margin: { left: marginX, right: marginX },
        head: [["Origin", "Beach", "Division", "Date Range"]],
        body: [[destinationName ?? "All Origins", beachName ?? "All Beaches", rangerName ?? "All Divisions", dateRange]],
        styles: { fontSize: 8, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: [244, 244, 245], textColor: [113, 113, 122], fontStyle: "bold", fontSize: 7 },
        bodyStyles: { textColor: [24, 24, 27] },
        theme: "grid",
      });

      autoTable(doc, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see addReportTable's own lastAutoTable note.
        startY: (doc as any).lastAutoTable.finalY + 4,
        margin: { left: marginX, right: marginX },
        head: [["Drives", "Recorded", "Estimated Remaining (~90%)", "No. of Bags", "Overall Weight"]],
        body: [[
          String(report.activity_count),
          `${report.weight_grand_total.toFixed(2)} kg`,
          `${report.remaining_weight_grand_total.toFixed(2)} kg`,
          String(report.total_bags),
          `${report.total_weight_kg.toFixed(2)} kg`,
        ]],
        styles: { fontSize: 8, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: [244, 244, 245], textColor: [113, 113, 122], fontStyle: "bold", fontSize: 7 },
        bodyStyles: { textColor: [24, 24, 27], fontStyle: "bold" },
        theme: "grid",
      });

      // Drive-wise details — mirrors the on-screen `DriveWiseSection`: its
      // own page(s) per drive, with the field summary, kg-only segregation
      // grid, and every captured photo.
      for (const activity of report.activities) {
        await addDriveSection(doc, autoTable, activity, report.countries, report.categories, pageWidth, pageHeight, marginX);
      }

      if (!singleDrive) {
        doc.addPage();
        const firstTableEnd = addReportTable(doc, autoTable, {
          title: "As Recorded — 10% Sample",
          startY: 14,
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
          startY: firstTableEnd + 6,
          marginX,
          pageWidth,
          countries: report.countries,
          categories: report.categories,
          matrix: report.remaining_matrix,
          weightMatrix: report.remaining_weight_matrix,
          categoryTotals: report.remaining_category_totals,
          weightCategoryTotals: report.remaining_weight_category_totals,
        });
      }

      for (const chart of getChartImages()) {
        addChartPage(doc, chart);
      }

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
    ["Sl.\nNo", "Origin", ...categories, ...(totalBags !== undefined ? ["No. of\nBags"] : [])],
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

/**
 * One drive's own page(s) — mirrors `DriveWiseSection`'s `DriveCard`: a
 * field summary, its kg-only recorded-rows-only segregation grid (via the
 * same `buildDriveSegregationGrid` the on-screen card uses), then every
 * captured photo.
 */
async function addDriveSection(
  doc: JsPdfDoc,
  autoTable: AutoTableFn,
  activity: BeachCleaningActivity,
  countries: string[],
  categories: string[],
  pageWidth: number,
  pageHeight: number,
  marginX: number,
): Promise<void> {
  doc.addPage();
  let y = 14;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const heading = activity.beach?.name
    ? `${activity.beach.name}${activity.destination?.name ? ` · ${activity.destination.name}` : ""}`
    : activity.activity_name;
  doc.text(heading, marginX, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${activity.activity_name} — ${activity.status === "submitted" ? "Submitted" : "In Progress"}`, marginX, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["Division", "Date", "Participants", "Total Collected", "Beach Officer"]],
    body: [[
      officerLabel(activity.officer),
      activity.created_at
        ? new Date(activity.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
      String(activity.participant_count ?? "—"),
      `${activity.bags_collected ?? 0} bags${
        activity.total_weight_kg !== null ? ` / ${activity.total_weight_kg.toFixed(1)} kg` : ""
      }`,
      activity.beach?.officer_name || "—",
    ]],
    styles: { fontSize: 8, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.1 },
    headStyles: { fillColor: [244, 244, 245], textColor: [113, 113, 122], fontStyle: "bold", fontSize: 7 },
    bodyStyles: { textColor: [24, 24, 27] },
    theme: "grid",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see addReportTable's own lastAutoTable note.
  y = (doc as any).lastAutoTable.finalY + 4;

  const grid = buildDriveSegregationGrid(activity, countries, categories);
  if (grid.recordedCountries.length === 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("No segregation data recorded for this drive.", marginX, y);
    y += 6;
  } else {
    y =
      addKgOnlyTable(doc, autoTable, {
        title: "Segregation — 10% Sample Collection",
        startY: y,
        marginX,
        pageWidth,
        countries: grid.recordedCountries,
        categories: grid.recordedCategories,
        matrix: grid.matrix,
        categoryTotals: grid.categoryTotals,
        totalBags: activity.bags_collected ?? 0,
      }) + 6;
  }

  const sections: { title: string; items: BeachCleaningMediaRef[] }[] = [
    { title: "Before Photos", items: activity.media.filter((m) => m.kind === "before") },
    { title: "Collection Photos", items: activity.media.filter((m) => m.kind === "collection") },
    { title: "Other Photos", items: activity.media.filter((m) => m.kind === "other") },
  ];

  for (const section of sections) {
    if (section.items.length === 0) continue;
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 14;
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`${section.title} (${section.items.length})`, marginX, y);
    y += 4;
    y = await addPhotoGrid(doc, section.items, marginX, y, pageWidth, pageHeight);
    y += 4;
  }
}

/** Kg-only counterpart of `addReportTable` — one line per cell instead of "Nos. / kg", scoped to just the rows/columns a single drive actually recorded. */
function addKgOnlyTable(
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
    categoryTotals,
    totalBags,
  }: {
    title: string;
    startY: number;
    marginX: number;
    pageWidth: number;
    countries: string[];
    categories: string[];
    matrix: Record<string, Record<string, number>>;
    categoryTotals: Record<string, number>;
    totalBags: number;
  },
): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(title, marginX, startY);

  const head = [["Sl.\nNo", "Origin", ...categories, "No. of\nBags"]];

  const body = countries.map((country, index) => [
    String(index + 1),
    country,
    ...categories.map((category) => `${(matrix[country]?.[category] ?? 0).toFixed(2)} kg`),
    "0",
  ]);

  body.push([
    "",
    "TOTAL",
    ...categories.map((category) => `${(categoryTotals[category] ?? 0).toFixed(2)} kg`),
    String(totalBags),
  ]);

  const usableWidth = pageWidth - marginX * 2;
  const slNoWidth = 8;
  const countryWidth = 30;
  const bagsWidth = 14;
  const categoryWidth = (usableWidth - slNoWidth - countryWidth - bagsWidth) / categories.length;

  const columnStyles: Record<number, { cellWidth: number; halign?: "left" | "center" }> = {
    0: { cellWidth: slNoWidth, halign: "center" },
    1: { cellWidth: countryWidth },
  };
  categories.forEach((_, i) => {
    columnStyles[i + 2] = { cellWidth: categoryWidth, halign: "center" };
  });
  columnStyles[categories.length + 2] = { cellWidth: bagsWidth, halign: "center" };

  autoTable(doc, {
    head,
    body,
    startY: startY + 2,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 6, cellPadding: 1, lineColor: [220, 220, 220], lineWidth: 0.1, valign: "middle" },
    headStyles: { fillColor: [244, 244, 245], textColor: [39, 39, 42], fontStyle: "bold", halign: "center" },
    bodyStyles: { textColor: [24, 24, 27] },
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

/**
 * Lays out [items] as a wrapping grid of bordered thumbnails starting at
 * ([marginX], [startY]), fetching each photo through the same authenticated
 * proxy the on-screen `PhotoGrid` uses, and paginating when a row would run
 * past the bottom margin. Returns the Y position just past the last row.
 */
async function addPhotoGrid(
  doc: JsPdfDoc,
  items: BeachCleaningMediaRef[],
  marginX: number,
  startY: number,
  pageWidth: number,
  pageHeight: number,
): Promise<number> {
  const thumbSize = 32;
  const gap = 3;
  const usableWidth = pageWidth - marginX * 2;
  const columns = Math.max(1, Math.floor((usableWidth + gap) / (thumbSize + gap)));

  let x = marginX;
  let y = startY;
  let col = 0;

  for (const item of items) {
    if (col === 0 && y + thumbSize > pageHeight - 10) {
      doc.addPage();
      y = 14;
    }

    doc.setDrawColor(220, 220, 220);
    doc.rect(x, y, thumbSize, thumbSize);

    const image = await fetchImageForPdf(item.id);
    if (image) {
      const aspect = image.width / image.height;
      let drawWidth = thumbSize;
      let drawHeight = thumbSize / aspect;
      if (drawHeight > thumbSize) {
        drawHeight = thumbSize;
        drawWidth = thumbSize * aspect;
      }
      const offsetX = x + (thumbSize - drawWidth) / 2;
      const offsetY = y + (thumbSize - drawHeight) / 2;
      try {
        doc.addImage(image.dataUrl, image.format, offsetX, offsetY, drawWidth, drawHeight);
      } catch {
        // Corrupt/unsupported image data — leave the empty bordered box in its place.
      }
    }

    col += 1;
    if (col >= columns) {
      col = 0;
      x = marginX;
      y += thumbSize + gap;
    } else {
      x += thumbSize + gap;
    }
  }

  if (col !== 0) y += thumbSize + gap;
  return y;
}

async function fetchImageForPdf(
  id: string,
): Promise<{ dataUrl: string; format: "JPEG" | "PNG"; width: number; height: number } | null> {
  try {
    const res = await fetch(`${MEDIA_BASE_URL}/${id}`);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await blobToDataUrl(blob);
    const format: "JPEG" | "PNG" = blob.type.includes("png") ? "PNG" : "JPEG";
    const { width, height } = await getImageDimensions(dataUrl);
    return { dataUrl, format, width, height };
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

/** Its own page per chart — a stacked country × category bar is tall enough that sharing a page with anything else would force it small. */
function addChartPage(doc: JsPdfDoc, chart: ReportChartImage): void {
  doc.addPage();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;
  const titleY = 14;
  const topY = 20;
  const maxWidth = pageWidth - marginX * 2;
  const maxHeight = pageHeight - topY - 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(chart.title, marginX, titleY);

  let width = maxWidth;
  let height = width / chart.aspectRatio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * chart.aspectRatio;
  }
  const x = marginX + (maxWidth - width) / 2;

  doc.addImage(chart.dataUrl, "PNG", x, topY, width, height);
}
