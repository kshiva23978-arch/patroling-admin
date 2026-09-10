"use client";

import { useState, type RefObject } from "react";
import { secondaryButtonClass } from "@/lib/ui-classes";

/**
 * Snapshots [targetRef]'s DOM (the report table + charts) into a downloaded
 * PDF, client-side — no backend involvement, so this works the same
 * whether the report data came from the local dev backend or the deployed
 * one. Rasterizes at 2x scale for print-legible text, then lays that single
 * image onto ONE custom-height PDF page sized to fit it exactly — a fixed
 * A4 page height would otherwise force jsPDF to slice the tall image across
 * multiple pages at arbitrary pixel offsets, cutting table rows in half at
 * the seam. Width stays A4-landscape; height grows to match the content.
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

      const a4Landscape = new jsPDF("l", "mm", "a4");
      const pageWidth = a4Landscape.internal.pageSize.getWidth();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Custom [width, height] formats are taken literally by jsPDF only
      // under "p" — "l" swaps them to force width >= height, which would
      // undo the A4-landscape width we actually want here.
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: [pageWidth, imgHeight] });
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
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
