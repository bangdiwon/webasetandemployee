// ============================================================
// Export Word (.docx) asli: membaca tampilan form di layar (teks, tabel bertingkat,
// garis, lebar kolom, logo) lalu menyusunnya menjadi dokumen Word yang rapi.
// Dipakai oleh semua form (OP, TELE, Bulky, Tanda Terima).
// ============================================================
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  PageOrientation,
  LevelFormat,
  HeightRule,
  LineRuleType,
  TableLayoutType,
  SectionType,
} from "docx";

const FONT = "Arial";
const MM_TWIP = 56.6929;
const PX_TWIP = 15; // 1px = 0.75pt = 15 twips

// Ukuran kertas (mm) & margin; sama dengan DocPage di layar
const PAGES = {
  a4: { w: 210, h: 297, mTop: 11, mLeft: 14, landscape: false },
  a4l: { w: 297, h: 210, mTop: 9, mLeft: 13, landscape: true },
  a5: { w: 148, h: 210, mTop: 8, mLeft: 10, landscape: false },
};

const px = (v) => parseFloat(v) || 0;
const twip = (pxValue) => Math.max(0, Math.round(pxValue * PX_TWIP));
const cs = (el) => getComputedStyle(el);

const rgbHex = (color) => {
  const m = (color || "").match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  if (m.length === 4 && parseFloat(m[3]) === 0) return null; // transparan
  return m
    .slice(0, 3)
    .map((n) => Math.round(Number(n)).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
};

const BLOCK_DISPLAY = new Set(["block", "list-item", "table", "flex", "grid", "flow-root"]);
const isBlockEl = (el) =>
  el.nodeType === 1 &&
  (["TABLE", "UL", "OL", "HR"].includes(el.tagName) || BLOCK_DISPLAY.has(cs(el).display));
const isHidden = (el) => cs(el).display === "none";

// ------------------------------------------------------------
// Garis (border)
// ------------------------------------------------------------
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

const borderOf = (style, side) => {
  const w = px(style[`border${side}Width`]);
  const st = style[`border${side}Style`];
  if (!(w > 0) || st === "none" || st === "hidden") return NO_BORDER;
  return {
    style: st === "dashed" ? BorderStyle.DASHED : st === "dotted" ? BorderStyle.DOTTED : BorderStyle.SINGLE,
    size: Math.max(2, Math.round(w * 6)), // delapan-per-point (1px = 6)
    color: rgbHex(style[`border${side}Color`]) || "000000",
  };
};

// ------------------------------------------------------------
// Teks (inline)
// ------------------------------------------------------------
const runProps = (el) => {
  const s = cs(el);
  const weight = s.fontWeight === "bold" ? 700 : parseInt(s.fontWeight, 10) || 400;
  return {
    font: FONT,
    size: Math.max(2, Math.round(px(s.fontSize) * 1.5)), // setengah-point
    bold: weight >= 600,
    italics: s.fontStyle === "italic",
    underline: (s.textDecorationLine || "").includes("underline") ? {} : undefined,
    color: rgbHex(s.color) || "000000",
  };
};

// Kumpulkan bagian inline: { text, props } | { br } | { img }
const collectInline = (nodes, parentEl, out) => {
  nodes.forEach((node) => {
    if (node.nodeType === 3) {
      const text = node.textContent.replace(/[ \t\r\n\f]+/g, " ");
      if (text) out.push({ text, props: runProps(parentEl) });
    } else if (node.nodeType === 1) {
      if (isHidden(node)) return;
      if (node.tagName === "BR") out.push({ br: true });
      else if (node.tagName === "IMG") out.push({ img: node });
      else collectInline(node.childNodes, node, out);
    }
  });
};

const trimParts = (parts) => {
  while (parts.length && parts[0].text !== undefined) {
    parts[0].text = parts[0].text.replace(/^ +/, "");
    if (parts[0].text) break;
    parts.shift();
  }
  while (parts.length && parts[parts.length - 1].text !== undefined) {
    const last = parts[parts.length - 1];
    last.text = last.text.replace(/ +$/, "");
    if (last.text) break;
    parts.pop();
  }
  return parts;
};

const ALIGN = {
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  end: AlignmentType.RIGHT,
  justify: AlignmentType.BOTH,
};

// ------------------------------------------------------------
// Konverter utama
// ------------------------------------------------------------
class Converter {
  constructor(scaleK, images) {
    this.k = scaleK; // faktor skala layar (zoom/transform) agar pengukuran tetap akurat
    this.images = images; // Map src -> { data, type }
    this.alphaInstance = 0;
  }

  width(el) {
    return el.getBoundingClientRect().width / this.k;
  }

  // ---- paragraf ----
  paragraph(nodes, el, ctx, anon = false) {
    const s = cs(el);
    const parts = trimParts((() => {
      const out = [];
      collectInline(nodes, el, out);
      return out;
    })());

    const children = parts.map((p) => {
      if (p.br) return new TextRun({ break: 1, font: FONT });
      if (p.img) return this.image(p.img);
      return new TextRun({ text: p.text, ...p.props });
    });
    if (!children.length) {
      children.push(new TextRun({ text: "", font: FONT, size: Math.round(px(s.fontSize) * 1.5) }));
    }

    const fontPx = px(s.fontSize) || 11;
    const lh = px(s.lineHeight);
    const ratio = lh ? Math.min(1.6, Math.max(1, lh / fontPx)) : 1.15;

    const paraProps = {
      children,
      alignment: ALIGN[s.textAlign] || AlignmentType.LEFT,
      // Paragraf "anonim" (teks langsung di dalam sel/kotak) tidak memakai margin/padding/garis
      // wadahnya: itu sudah diatur oleh sel/kotak itu sendiri.
      spacing: {
        before: anon ? 0 : twip(px(s.marginTop) + px(s.paddingTop)),
        after: anon ? 0 : twip(px(s.marginBottom) + px(s.paddingBottom)),
        line: Math.round((ratio / 1.15) * 240),
        lineRule: LineRuleType.AUTO,
      },
      indent: {
        left: twip(anon ? ctx.indent : px(s.marginLeft) + px(s.paddingLeft) + ctx.indent),
        right: anon ? 0 : twip(px(s.marginRight) + px(s.paddingRight)),
      },
    };

    const bottom = anon ? NO_BORDER : borderOf(s, "Bottom");
    const top = anon ? NO_BORDER : borderOf(s, "Top");
    if (bottom !== NO_BORDER || top !== NO_BORDER) {
      paraProps.border = {};
      if (bottom !== NO_BORDER) paraProps.border.bottom = { ...bottom, space: 2 };
      if (top !== NO_BORDER) paraProps.border.top = { ...top, space: 2 };
    }
    return new Paragraph(paraProps);
  }

  image(img) {
    const info = this.images.get(img.getAttribute("src"));
    if (!info) return new TextRun({ text: "", font: FONT });
    const w = parseFloat(img.getAttribute("width")) || this.width(img);
    const h = parseFloat(img.getAttribute("height")) || img.getBoundingClientRect().height / this.k;
    return new ImageRun({
      type: info.type,
      data: info.data,
      transformation: { width: Math.round(w), height: Math.round(h) },
    });
  }

  // ---- anak-anak blok ----
  children(parent, ctx) {
    const out = [];
    let buf = [];

    const flush = () => {
      if (!buf.length) return;
      const onlySpace = buf.every((n) => n.nodeType === 3 && !n.textContent.trim());
      if (!onlySpace) out.push(this.paragraph(buf, parent, ctx, true));
      buf = [];
    };

    parent.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        buf.push(node);
        return;
      }
      if (node.nodeType !== 1 || isHidden(node)) return;

      if (node.tagName === "TABLE") {
        flush();
        out.push(this.table(node, ctx));
      } else if (node.tagName === "HR") {
        flush();
        out.push(this.rule(node, ctx));
      } else if (node.tagName === "UL" || node.tagName === "OL") {
        flush();
        out.push(...this.list(node, ctx));
      } else if (isBlockEl(node)) {
        flush();
        const hasBlock = [...node.children].some((c) => isBlockEl(c));
        if (hasBlock) {
          const s = cs(node);
          out.push(...this.children(node, { ...ctx, indent: ctx.indent + px(s.paddingLeft) + px(s.marginLeft) }));
        } else {
          out.push(this.paragraph(node.childNodes, node, ctx));
        }
      } else {
        buf.push(node);
      }
    });
    flush();
    return out;
  }

  rule(hr, ctx) {
    const s = cs(hr);
    const border = borderOf(s, "Top");
    return new Paragraph({
      children: [new TextRun({ text: "", font: FONT, size: 2 })],
      spacing: { before: twip(px(s.marginTop)), after: twip(px(s.marginBottom)), line: 20, lineRule: LineRuleType.EXACT },
      indent: { left: twip(ctx.indent) },
      border: { bottom: { ...(border === NO_BORDER ? { style: BorderStyle.SINGLE, size: 6, color: "000000" } : border), space: 1 } },
    });
  }

  list(listEl, ctx) {
    const s = cs(listEl);
    const ordered = listEl.tagName === "OL";
    const instance = ordered ? ++this.alphaInstance : 0;
    const left = twip(px(s.paddingLeft) + ctx.indent);
    const items = [...listEl.children].filter((c) => c.tagName === "LI");
    return items.map((li) => {
      const ls = cs(li);
      const parts = trimParts((() => {
        const arr = [];
        collectInline(li.childNodes, li, arr);
        return arr;
      })());
      const fontPx = px(ls.fontSize) || 11;
      const ratio = px(ls.lineHeight) ? Math.min(1.6, Math.max(1, px(ls.lineHeight) / fontPx)) : 1.15;
      return new Paragraph({
        children: parts.map((p) =>
          p.br ? new TextRun({ break: 1, font: FONT }) : new TextRun({ text: p.text || "", ...(p.props || {}) }),
        ),
        numbering: ordered ? { reference: "alpha", level: 0, instance } : { reference: "bullet", level: 0 },
        alignment: ALIGN[ls.textAlign] || AlignmentType.LEFT,
        spacing: { before: 0, after: twip(px(ls.marginBottom)), line: Math.round((ratio / 1.15) * 240), lineRule: LineRuleType.AUTO },
        indent: { left: left + 280, hanging: 280 },
      });
    });
  }

  // ---- tabel ----
  table(tableEl, ctx) {
    const tRect = tableEl.getBoundingClientRect();
    const tW = tRect.width / this.k;
    const totalDxa = Math.max(500, Math.round(Math.min(1, tW / ctx.wpx) * ctx.widthDxa));

    const rows = [...tableEl.rows];
    const cells = rows.flatMap((r) => [...r.cells]);

    // Garis tepi kolom (dikelompokkan, toleransi 1.5px)
    const rawEdges = [];
    cells.forEach((c) => {
      const r = c.getBoundingClientRect();
      rawEdges.push((r.left - tRect.left) / this.k, (r.right - tRect.left) / this.k);
    });
    rawEdges.sort((a, b) => a - b);
    const xs = [];
    rawEdges.forEach((x) => {
      if (!xs.length || x - xs[xs.length - 1] > 1.5) xs.push(x);
    });
    const colPx = xs.slice(1).map((x, i) => x - xs[i]);
    const sumPx = colPx.reduce((a, b) => a + b, 0) || 1;
    let colDxa = colPx.map((p) => Math.max(120, Math.round((p / sumPx) * totalDxa)));
    const diff = totalDxa - colDxa.reduce((a, b) => a + b, 0);
    colDxa[colDxa.length - 1] += diff;

    const idxOf = (x) => {
      let best = 0;
      xs.forEach((v, i) => {
        if (Math.abs(v - x) < Math.abs(xs[best] - x)) best = i;
      });
      return best;
    };

    // Catatan sel + peta grid (untuk menentukan garis antar sel)
    const tStyle = cs(tableEl);
    const grid = [];
    const recs = [];
    rows.forEach((row, ri) => {
      [...row.cells].forEach((cell) => {
        const r = cell.getBoundingClientRect();
        const c0 = idxOf((r.left - tRect.left) / this.k);
        const c1 = Math.max(c0 + 1, idxOf((r.right - tRect.left) / this.k));
        const rec = { cell, ri, c0, c1, rs: cell.rowSpan || 1, style: cs(cell) };
        recs.push(rec);
        for (let rr = ri; rr < ri + rec.rs; rr++) {
          grid[rr] = grid[rr] || [];
          for (let cc = c0; cc < c1; cc++) grid[rr][cc] = rec;
        }
      });
    });

    const tableLeft = borderOf(tStyle, "Left");
    const tableTop = borderOf(tStyle, "Top");

    const rowObjs = rows.map((row, ri) => {
      const rowRecs = recs.filter((r) => r.ri === ri);
      let height = 0;
      const tableCells = rowRecs.map((rec) => {
        const { cell, c0, c1, style } = rec;
        const left = c0 === 0 ? tableLeft : borderOf(grid[ri]?.[c0 - 1]?.style || style, "Right");
        const topNeighbor = ri === 0 ? null : grid[ri - 1]?.[c0];
        const top = ri === 0 ? tableTop : topNeighbor ? borderOf(topNeighbor.style, "Bottom") : NO_BORDER;
        const spanDxa = colDxa.slice(c0, c1).reduce((a, b) => a + b, 0);
        const padL = twip(px(style.paddingLeft));
        const padR = twip(px(style.paddingRight));

        const bg = [cell, row, row.parentElement]
          .map((e) => rgbHex(cs(e).backgroundColor))
          .find(Boolean);

        const cellW = this.width(cell) - px(style.paddingLeft) - px(style.paddingRight);
        const content = this.children(cell, {
          widthDxa: Math.max(300, spanDxa - padL - padR),
          wpx: Math.max(10, cellW),
          indent: 0,
        });
        if (!content.length || content[content.length - 1] instanceof Table) {
          content.push(new Paragraph({ children: [new TextRun({ text: "", font: FONT, size: 4 })], spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT } }));
        }

        const h = parseFloat(cell.style.height);
        if (h > height) height = h;

        const va = style.verticalAlign;
        return new TableCell({
          children: content,
          columnSpan: c1 - c0 > 1 ? c1 - c0 : undefined,
          rowSpan: rec.rs > 1 ? rec.rs : undefined,
          width: { size: spanDxa, type: WidthType.DXA },
          verticalAlign: va === "bottom" ? VerticalAlign.BOTTOM : va === "top" ? VerticalAlign.TOP : VerticalAlign.CENTER,
          shading: bg ? { type: ShadingType.CLEAR, fill: bg, color: "auto" } : undefined,
          margins: {
            top: twip(px(style.paddingTop)),
            bottom: twip(px(style.paddingBottom)),
            left: padL,
            right: padR,
          },
          borders: {
            top,
            left,
            bottom: borderOf(style, "Bottom"),
            right: borderOf(style, "Right"),
          },
        });
      });

      return new TableRow({
        children: tableCells,
        cantSplit: true,
        height: height ? { value: twip(height), rule: HeightRule.ATLEAST } : undefined,
      });
    });

    return new Table({
      rows: rowObjs,
      width: { size: totalDxa, type: WidthType.DXA },
      columnWidths: colDxa,
      layout: TableLayoutType.FIXED,
      borders: {
        top: NO_BORDER,
        bottom: NO_BORDER,
        left: NO_BORDER,
        right: NO_BORDER,
        insideHorizontal: NO_BORDER,
        insideVertical: NO_BORDER,
      },
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  }
}

// ------------------------------------------------------------
// Gambar
// ------------------------------------------------------------
const loadImage = async (src) => {
  let blob;
  if (src.startsWith("data:")) {
    const [head, b64] = src.split(",");
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { data: bytes, type: /jpe?g/.test(head) ? "jpg" : "png" };
  }
  blob = await (await fetch(src)).blob();
  return {
    data: new Uint8Array(await blob.arrayBuffer()),
    type: /jpe?g/.test(blob.type) ? "jpg" : "png",
  };
};

// ------------------------------------------------------------
// Entry point
// ------------------------------------------------------------
/**
 * Membuat & mengunduh file Word (.docx) dari area dokumen.
 * @param {string} elementId  id elemen yang berisi satu/lebih .doc-page-inner
 * @param {string} filename   nama file tanpa ekstensi
 * @param {"a4"|"a4l"|"a5"} size ukuran kertas
 */
export const exportToDocx = async (elementId, filename, size = "a4") => {
  const root = document.getElementById(elementId);
  if (!root) return;
  const spec = PAGES[size] || PAGES.a4;

  // Matikan zoom preview sementara agar pengukuran akurat
  const scroller = root.closest(".doc-scroll");
  const oldZoom = scroller?.style.zoom;
  if (scroller) scroller.style.zoom = "1";

  try {
    const pageInners = [...root.querySelectorAll(".doc-page-inner")];
    if (!pageInners.length) return;

    // Siapkan semua gambar lebih dulu (proses async)
    const images = new Map();
    const srcs = new Set([...root.querySelectorAll("img")].map((i) => i.getAttribute("src")));
    await Promise.all(
      [...srcs].map(async (src) => {
        try {
          images.set(src, await loadImage(src));
        } catch (e) {
          console.warn("Gambar tidak dapat dimuat untuk Word:", src, e);
        }
      }),
    );

    const first = pageInners[0];
    const k = first.offsetWidth ? first.getBoundingClientRect().width / first.offsetWidth : 1;
    const conv = new Converter(k || 1, images);

    const pageW = Math.round(spec.w * MM_TWIP);
    const pageH = Math.round(spec.h * MM_TWIP);
    const mTop = Math.round(spec.mTop * MM_TWIP);
    const mLeft = Math.round(spec.mLeft * MM_TWIP);
    const widthDxa = pageW - 2 * mLeft;

    const sections = pageInners.map((inner) => {
      const ctx = { widthDxa, wpx: conv.width(inner), indent: 0 };
      const children = conv.children(inner, ctx);
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", font: FONT, size: 2 })],
          spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT },
        }),
      );
      return {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: spec.landscape
              ? { width: Math.min(pageW, pageH), height: Math.max(pageW, pageH), orientation: PageOrientation.LANDSCAPE }
              : { width: pageW, height: pageH },
            margin: { top: mTop, bottom: mTop, left: mLeft, right: mLeft, header: 0, footer: 0 },
          },
        },
        children,
      };
    });

    const doc = new Document({
      creator: "Project Dimas",
      title: filename,
      styles: { default: { document: { run: { font: FONT, size: 17 } } } },
      numbering: {
        config: [
          {
            reference: "bullet",
            levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT }],
          },
          {
            reference: "alpha",
            levels: [{ level: 0, format: LevelFormat.LOWER_LETTER, text: "%1.", alignment: AlignmentType.LEFT }],
          },
        ],
      },
      sections,
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    if (scroller) scroller.style.zoom = oldZoom || "";
  }
};
