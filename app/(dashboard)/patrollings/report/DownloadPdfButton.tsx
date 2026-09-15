"use client";

import { useState } from "react";
import { secondaryButtonClass } from "@/lib/ui-classes";
import type { PatrolReportData } from "@/lib/resources/patrollings";
import { patrolStatusLabel } from "@/lib/patrol-status";
import type { PatrolReportLabels } from "./ReportContent";

/**
 * Builds the PDF from the report data (jsPDF text + `autoTable`), same
 * approach as the beach-cleaning report — real selectable text, not a
 * screenshot. The map is deliberately not included: a Leaflet map can't be
 * rasterised without pulling every tile through a canvas proxy, and a
 * static picture of dozens of overlapping trails isn't legible on A4
 * anyway. The per-patrol table carries the same information.
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
        head: [["Patrols", "Distance Covered (km)", "Cases Recorded", "Incidents Recorded"]],
        body: [[
          summary.truncated ? `${summary.patrol_count} of ${summary.matched_count} (truncated)` : String(summary.patrol_count),
          summary.total_distance_km.toFixed(2),
          String(summary.case_count),
          String(summary.incident_count),
        ]],
      });

      if (summary.by_range.length > 1) {
        autoTable(doc, {
          ...tableStyles,
          startY: lastTableBottom(doc) + 6,
          head: [["Range", "Patrols", "Distance (km)", "Cases", "Incidents"]],
          body: summary.by_range.map((r) => [r.range, r.patrols, r.distance_km.toFixed(2), r.cases, r.incidents]),
          columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
        });
      }

      autoTable(doc, {
        ...tableStyles,
        startY: lastTableBottom(doc) + 6,
        head: [["Sl.\nNo", "Patrol ID", "Date", "Range / Beat", "Leader", "Staff Deployed", "Distance\n(km)", "Cases", "Incidents", "Status"]],
        body: report.entries.map((entry, i) => [
          i + 1,
          entry.patrol_id,
          entry.date,
          entry.beat ? `${entry.range?.name ?? "—"} / ${entry.beat.name}` : (entry.range?.name ?? "—"),
          entry.patrol_leader?.name || entry.patrol_leader?.employee_id || "—",
          entry.staff_names.join(", ") || "—",
          entry.distance_km.toFixed(2),
          entry.case_reports.length,
          entry.incidents.length,
          patrolStatusLabel(entry.status),
        ]),
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          6: { halign: "right" },
          7: { halign: "right" },
          8: { halign: "right" },
        },
        showHead: "everyPage",
      });

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

/** Where the most recent `autoTable` ended, so the next one starts below it. */
function lastTableBottom(doc: JsPdfDoc): number {
  return (doc as JsPdfDoc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 20;
}
