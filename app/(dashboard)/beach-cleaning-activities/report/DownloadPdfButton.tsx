"use client";

import { useState, type RefObject } from "react";
import { secondaryButtonClass } from "@/lib/ui-classes";

/**
 * Snapshots [targetRef]'s DOM (the report table + charts) into a downloaded
 * PDF, client-side — no backend involvement, so this works the same
 * whether the report data came from the local dev backend or the deployed
 * one. Rasterizes at 2x scale for print-legible text; `jsPDF` then slices
 * that single tall image across as many A4 pages as it takes (the report
 * table can easily run longer than one page with 22 countries + charts).
 *
 * Uses `html2canvas-pro`, not the plain `html2canvas` package — this app's
 * Tailwind v4 styles resolve to modern CSS color functions (`oklch`/`lab`),
 * which stock `html2canvas` can't parse at all and throws on ("Attempting
 * to parse an unsupported color function") the moment it walks any element
 * using one; the `-pro` fork adds that support and is otherwise a drop-in
 * replacement.
 */
export function DownloadPdfButton({ targetRef, filename }: { targetRef: RefObject<HTMLDivElement | null>; filename: string }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const download = async () => {
    const node = targetRef.current;
    if (!node || isGenerating) return;

    setIsGenerating(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);

      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
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
