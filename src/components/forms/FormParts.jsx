// ============================================================
// Komponen bersama untuk semua form dokumen (OP, TELE, Bulky, Tanda Terima)
// ============================================================
import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { Printer, FileText, FileDown } from "lucide-react";
import { exportToWord, exportToPdf } from "../../utils/export";

export const DOT_LINE = ".................................................";
export const DOT_SHORT = "........................";

export const JENIS_FORM = {
  SERAH_TERIMA: "SERAH_TERIMA",
  PENGEMBALIAN: "PENGEMBALIAN",
};

/** State input form: setField("kode") mengembalikan handler onChange. */
export const useFormInputs = (initial) => {
  const [inputs, setInputs] = useState(initial);
  const setField = (name) => (e) =>
    setInputs((prev) => ({ ...prev, [name]: e.target.value }));
  return [inputs, setField];
};

/** Nilai ditampilkan di dokumen: titik-titik jika form masih kosong (belum Generate). */
export const tampil = (blank, value, fallback = "-", dots = DOT_SHORT) =>
  blank ? dots : value || fallback;

export function Field({ label, wide, children }) {
  return (
    <div className="form-group" style={wide ? { gridColumn: "1 / -1" } : undefined}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export function JenisSelect({ value, onChange }) {
  return (
    <Field label="Jenis Form">
      <select value={value} onChange={onChange}>
        <option value={JENIS_FORM.SERAH_TERIMA}>Serah Terima Aset</option>
        <option value={JENIS_FORM.PENGEMBALIAN}>Pengembalian Aset</option>
      </select>
    </Field>
  );
}

/** Kartu input di atas dokumen */
export function FormControls({ title, buttonLabel, onGenerate, children }) {
  return (
    <div className="card form-controls no-print" style={{ marginBottom: 20 }}>
      <h3>{title}</h3>
      <div className="grid-form">{children}</div>
      <button className="btn-primary" style={{ marginTop: 15 }} onClick={onGenerate}>
        {buttonLabel}
      </button>
    </div>
  );
}

/**
 * Pembungkus preview + tombol Print / Word / PDF.
 * Preview otomatis diperkecil agar muat di lebar layar (HP/tablet/laptop);
 * ukuran asli dokumen untuk Print/PDF/Word tidak berubah.
 */
export function PreviewWrapper({ areaId, filename, size = "a4", children }) {
  const boxRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    const scroller = scrollRef.current;
    if (!box || !scroller) return undefined;

    const fit = () => {
      scroller.style.zoom = "1";
      const doc = scroller.firstElementChild;
      if (!doc) return;
      const cs = getComputedStyle(box);
      const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const natural = doc.scrollWidth;
      scroller.style.zoom = natural > avail ? String(Math.max(0.3, avail / natural)) : "1";
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  });

  return (
    <div className="print-wrapper" ref={boxRef}>
      <div className="no-print preview-toolbar">
        <button className="btn-success btn-gray" onClick={() => window.print()}>
          <Printer size={16} /> Cetak / Print
        </button>
        <button className="btn-success btn-blue" onClick={() => exportToWord(areaId, filename, size)}>
          <FileText size={16} /> Download Word
        </button>
        <button className="btn-success btn-red" onClick={() => exportToPdf(areaId, filename, size)}>
          <FileDown size={16} /> Download PDF
        </button>
      </div>
      <div className="doc-scroll" ref={scrollRef}>
        {children}
      </div>
    </div>
  );
}

/**
 * Satu halaman kertas berukuran tetap (a4 | a4l | a5).
 * Isi yang terlalu panjang otomatis diperkecil agar SELALU muat dalam 1 halaman,
 * sehingga hasil Print / PDF tidak pernah melebihi jumlah DocPage.
 */
export function DocPage({ size = "a4", pageBreak = false, children }) {
  const outer = useRef(null);
  const inner = useRef(null);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const cs = getComputedStyle(o);
    const avail =
      o.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

    let s = 1;
    i.style.transform = "";
    i.style.width = "";
    for (let n = 0; n < 8; n++) {
      i.style.width = s < 1 ? `${100 / s}%` : "";
      i.style.transform = s < 1 ? `scale(${s})` : "";
      const h = i.offsetHeight * s;
      if (h <= avail || s <= 0.5) break;
      s = Math.max(0.5, s * (avail / h) * 0.985);
    }
  });

  return (
    <div
      ref={outer}
      className={`page-container doc-page doc-${size}`}
      style={pageBreak ? { pageBreakBefore: "always", breakBefore: "page" } : undefined}>
      <div ref={inner} className="doc-page-inner">
        {children}
      </div>
    </div>
  );
}

const LOGO_RATIO = 81 / 251; // logo.png 251 x 81

/**
 * Kop dokumen: logo (public/logo.png) + judul + No. Form / Rev / Tanggal.
 * noForm = nomor form SOP yang PERMANEN (bukan nomor surat berjalan).
 * Dibuat tanpa rowSpan agar garis tidak tembus saat diexport ke PDF.
 */
export function DocHeader({ logo, title, noForm, tanggalRev, logoWidth = 125 }) {
  const baris = [`No. Form: ${noForm}`, "Rev: 00", `Tanggal: ${tanggalRev}`, "Dokumen Terbatas"];
  return (
    <table className="table-bordered header-box" style={{ width: "100%", marginBottom: 10 }}>
      <tbody>
        <tr>
          <td style={{ width: "25%", textAlign: "center", verticalAlign: "middle", padding: 6 }}>
            <img
              src={logo}
              alt="Logo DIKA"
              width={logoWidth}
              height={Math.round(logoWidth * LOGO_RATIO)}
              style={{ display: "inline-block" }}
            />
          </td>
          <td style={{ width: "40%", textAlign: "center", verticalAlign: "middle", padding: 6 }}>
            <h5 style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>{title}</h5>
          </td>
          <td style={{ width: "35%", padding: 0, verticalAlign: "top" }}>
            {baris.map((teks, i) => (
              <div
                key={teks}
                style={{
                  fontSize: 11,
                  padding: "3px 6px",
                  borderBottom: i < baris.length - 1 ? "1px solid #000" : "none",
                }}>
                {teks}
              </div>
            ))}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** Kop sederhana: logo di tengah, judul bergaris bawah, lalu nomor form (dipakai Form Bulky) */
export function DocHeaderCentered({ logo, title, noForm, logoWidth = 135 }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 10 }}>
      <img
        src={logo}
        alt="Logo DIKA"
        width={logoWidth}
        height={Math.round(logoWidth * LOGO_RATIO)}
        style={{ display: "inline-block" }}
      />
      <div style={{ fontSize: 17, fontWeight: 700, textDecoration: "underline", letterSpacing: 0.3, margin: "2px 0" }}>
        {title}
      </div>
      <div style={{ fontSize: 11 }}>No. Form: {noForm}</div>
    </div>
  );
}

/** Baris "Label : Nilai" dengan lebar label tetap (aman untuk Word/PDF) */
export function InfoRows({ rows, labelWidth = "28%" }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td style={{ width: labelWidth, padding: "1.5px 0", verticalAlign: "top" }}>{label}</td>
            <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>: {value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Tabel tanda tangan dengan RUANG KOSONG untuk tanda tangan basah.
 * signers: [{ name, caption, sub?, title? }]  (title = judul kolom, mis. "Yang Menerima,")
 * space: tinggi ruang tanda tangan (px)
 */
export function SignatureTable({
  signers,
  space = 60,
  fontSize = 11,
  heading = "Tanda Tangan",
  marginBottom = 10,
}) {
  const width = `${100 / signers.length}%`;
  return (
    <table
      className="table-bordered text-center"
      style={{ width: "100%", marginBottom, fontSize }}>
      <tbody>
        {heading && (
          <tr style={{ backgroundColor: "#f8f9fa" }}>
            <td colSpan={signers.length} style={{ padding: 3, fontWeight: "bold" }}>
              {heading}
            </td>
          </tr>
        )}
        {signers.some((s) => s.title) && (
          <tr>
            {signers.map((s, i) => (
              <td key={`title-${i}`} style={{ padding: 4, fontWeight: "bold" }}>
                {s.title}
              </td>
            ))}
          </tr>
        )}
        <tr>
          {signers.map((s, i) => (
            <td key={`space-${i}`} style={{ width, height: space, borderBottom: "none" }}>
              &nbsp;
            </td>
          ))}
        </tr>
        <tr>
          {signers.map((s, i) => (
            <td key={`name-${i}`} style={{ borderTop: "none", padding: "0 4px 6px", verticalAlign: "bottom" }}>
              ({s.name})<br />
              {s.caption}
              {s.sub && (
                <>
                  <br />
                  <span style={{ fontSize: fontSize - 2, color: "#444" }}>{s.sub}</span>
                </>
              )}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
