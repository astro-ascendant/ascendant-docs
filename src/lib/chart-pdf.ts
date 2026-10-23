import { jsPDF } from "jspdf";
import { buildChartMarkdown, type ChartResult } from "@/lib/chart";

const MARGIN = 14;
const PAGE_WIDTH = 210;
const PAGE_BOTTOM = 285;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/** Dumps the chart markdown as plain monospaced text into a PDF. */
export function buildChartPdf(result: ChartResult): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  let cursorY = 18;

  for (const line of buildChartMarkdown(result).split("\n")) {
    const wrapped = doc.splitTextToSize(
      line === "" ? " " : line,
      CONTENT_WIDTH,
    );
    if (cursorY + wrapped.length * 4.5 > PAGE_BOTTOM) {
      doc.addPage();
      cursorY = 18;
    }
    doc.text(wrapped, MARGIN, cursorY);
    cursorY += wrapped.length * 4.5;
  }

  return doc.output("blob");
}
