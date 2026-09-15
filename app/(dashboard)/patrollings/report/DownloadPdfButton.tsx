"use client";

import { useState } from "react";
import { secondaryButtonClass } from "@/lib/ui-classes";
import type { PatrolReportData } from "@/lib/resources/patrollings";
import { patrolStatusLabel } from "@/lib/patrol-status";
import { formatMinutes } from "@/lib/duration";
import type { PatrolReportLabels } from "./ReportContent";
import { renderReportMapImage } from "./mapImage";
import { trailColorFor } from "./trailColors";

/**
 * Builds the PDF from the report data (jsPDF text + `autoTable`), same
 * approach as the beach-cleaning report — real selectable text, not a
 * screenshot. The route map gets its own page: rendered off-screen at
 * print resolution by [renderReportMapImage] (not a screenshot of the
 * live Leaflet map) and followed by a colour legend keyed to the patrol
 * table, so each trail can be identified on paper.
 */
export function DownloadPdfButton({ report, labels }: { report: PatrolReportData; labels: PatrolReportLabels }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const download = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
      const marginX = 10;
      const tableStyles = {
        styles: { fontSize: 8, cellPadding: 2, lineColor: [220, 220, 220] as [number, number, number], lineWidth: 0.1 },
        headStyles: {
          fillColor: [244, 244, 245] as [number, number, number],
          textColor: [113, 113, 122] as [number, number, number],
          fontStyle: "bold" as const,
          fontSize: 7,
        },
        bodyStyles: { textColor: [24, 24, 27] as [number, number, number] },
        theme: "grid" as const,
        margin: { left: marginX, right: marginX },
      };

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Patrol Report", marginX, 14);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`, marginX, 19);

      autoTable(doc, {
        ...tableStyles,
        startY: 23,
        head: [["Range", "Staff Deployed", "Case Recorded", "Incident Recorded", "Status", "Date Range"]],
        body: [[labels.ranges, labels.staff, labels.caseRecorded, labels.incidentRecorded, labels.statuses, labels.dateRange]],
      });

      const { summary } = report;
      autoTable(doc, {
        ...tableStyles,
        startY: lastTableBottom(doc) + 4,
        head: [["Patrols", "Distance Covered (km)", "Total Duration", "Cases Recorded", "Incidents Recorded"]],
        body: [[
          summary.truncated ? `${summary.patrol_count} of ${summary.matched_count} (truncated)` : String(summary.patrol_count),
          summary.total_distance_km.toFixed(2),
          formatMinutes(summary.total_duration_minutes),
          String(summary.case_count),
          String(summary.incident_count),
        ]],
      });

      if (summary.by_range.length > 1) {
        autoTable(doc, {
          ...tableStyles,
          startY: lastTableBottom(doc) + 6,
          head: [["Range", "Patrols", "Distance (km)", "Duration", "Cases", "Incidents"]],
          body: summary.by_range.map((r) => [r.range, r.patrols, r.distance_km.toFixed(2), formatMinutes(r.duration_minutes), r.cases, r.incidents]),
          columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
        });
      }

      autoTable(doc, {
        ...tableStyles,
        startY: lastTableBottom(doc) + 6,
        head: [["Sl.\nNo", "Patrol ID", "Date", "Range / Beat", "Leader", "Staff Deployed", "Distance\n(km)", "Duration", "Cases", "Incidents", "Status"]],
        body: report.entries.map((entry, i) => [
          i + 1,
          entry.patrol_id,
          entry.date,
          entry.beat ? `${entry.range?.name ?? "—"} / ${entry.beat.name}` : (entry.range?.name ?? "—"),
          entry.patrol_leader?.name || entry.patrol_leader?.employee_id || "—",
          entry.staff_names.join(", ") || "—",
          entry.distance_km.toFixed(2),
          formatMinutes(entry.duration_minutes),
          entry.case_reports.length,
          entry.incidents.length,
          patrolStatusLabel(entry.status),
        ]),
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          6: { halign: "right" },
          7: { halign: "right" },
          8: { halign: "right" },
          9: { halign: "right" },
        },
        showHead: "everyPage",
      });

      // Route map on its own page, then a colour → patrol legend under it.
      const mapImage = await renderReportMapImage(report.entries).catch(() => null);
      if (mapImage) {
        doc.addPage();
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Route Map", marginX, 14);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const usableWidth = pageWidth - 2 * marginX;
        const legendHeight = Math.min(60, 6 + Math.ceil(report.entries.length / 3) * 5);
        const maxImageHeight = pageHeight - 18 - legendHeight - 10;
        let imageWidth = usableWidth;
        let imageHeight = (usableWidth * mapImage.height) / mapImage.width;
        if (imageHeight > maxImageHeight) {
          imageHeight = maxImageHeight;
          imageWidth = (maxImageHeight * mapImage.width) / mapImage.height;
        }
        doc.addImage(mapImage.dataUrl, "PNG", marginX, 18, imageWidth, imageHeight);

        // Legend: swatch + patrol id, three columns.
        let y = 18 + imageHeight + 6;
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(63, 63, 70);
        doc.text("A = start, B = end · yellow flag = incident, red flag = case", marginX, y);
        y += 4;
        const columnWidth = usableWidth / 3;
        report.entries.forEach((entry, i) => {
          const column = i % 3;
          const row = Math.floor(i / 3);
          const x = marginX + column * columnWidth;
          const rowY = y + row * 5;
          if (rowY > pageHeight - 8) return; // legend overflow — the table page lists every patrol anyway
          const [r, g, b] = hexToRgb(trailColorFor(i));
          doc.setFillColor(r, g, b);
          doc.rect(x, rowY - 2.5, 3, 3, "F");
          doc.text(`${entry.patrol_id} · ${entry.date}`, x + 4.5, rowY);
        });
        doc.setTextColor(24, 24, 27);
      }

      const parts = ["patrol-report", labels.ranges !== "All Ranges" ? labels.ranges : "", labels.dateRange !== "All Dates" ? labels.dateRange : ""];
      const filename = `${parts.filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.pdf`;
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

type JsPdfDoc = InstanceType<typeof import("jspdf").jsPDF>;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Where the most recent `autoTable` ended, so the next one starts below it. */
function lastTableBottom(doc: JsPdfDoc): number {
  return (doc as JsPdfDoc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 20;
}
