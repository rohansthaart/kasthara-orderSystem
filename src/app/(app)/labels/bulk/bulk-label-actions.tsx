"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mmToDots } from "@/lib/label-settings";

export function BulkLabelActions({ widthMm, heightMm, dpi }: { widthMm: number; heightMm: number; dpi: number }) {
  const [downloading, setDownloading] = useState(false);
  async function download() {
    const labels = Array.from(document.querySelectorAll<HTMLElement>(".label-sheet"));
    if (!labels.length) return;
    setDownloading(true);
    try {
      const orientation = widthMm >= heightMm ? "landscape" : "portrait";
      const canvasWidth = mmToDots(widthMm, dpi);
      const canvasHeight = mmToDots(heightMm, dpi);
      const pdf = new jsPDF({ orientation, unit: "mm", format: [widthMm, heightMm] });
      for (const [index, label] of labels.entries()) {
        const image = await toPng(label, { canvasWidth, canvasHeight, pixelRatio: 1, backgroundColor: "#ffffff" });
        if (index > 0) pdf.addPage([widthMm, heightMm], orientation);
        pdf.addImage(image, "PNG", 0, 0, widthMm, heightMm);
      }
      pdf.save(`kasthara-labels-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setDownloading(false);
    }
  }
  return <Button onClick={download} disabled={downloading}><Download className="h-4 w-4" />{downloading ? "Preparing download..." : "Download labels"}</Button>;
}
