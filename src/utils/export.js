import html2pdf from "html2pdf.js";

// Word (.docx) dibuat dari tampilan form di layar; lihat utils/exportWord.js
export { exportToDocx as exportToWord } from "./exportWord";

const PDF_OPTIONS = {
  a4: { format: "a4" },
  a4l: { format: "a4", orientation: "landscape" },
  a5: { format: "a5" },
};

/** Unduh area dokumen sebagai PDF. */
export const exportToPdf = (elementId, filename, size = "a4") => {
  const el = document.getElementById(elementId);
  if (!el) return;
  return html2pdf()
    .set({
      margin: 0,
      filename: `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: PDF_OPTIONS[size] || PDF_OPTIONS.a4,
    })
    .from(el)
    .save();
};
