// ============================================================
// Form Serah Terima Aset (SOP) - dipakai oleh Form OP dan Form TELE.
// Perbedaan TELE: ada Upliner Pemegang Aset (3 tanda tangan) dan tanpa baris Keterangan.
// Dokumen selalu tampil (kosong) saat menu dibuka; tombol Generate mengisinya otomatis.
// Hasil Print/PDF selalu tepat 2 halaman.
// ============================================================
import React, { useState } from "react";
import {
  DOT_LINE,
  DOT_SHORT,
  JENIS_FORM,
  Field,
  JenisSelect,
  FormControls,
  PreviewWrapper,
  DocPage,
  DocHeader,
  InfoRows,
  SignatureTable,
  useFormInputs,
  tampil,
} from "./FormParts";
import KetentuanAset from "./KetentuanAset";
import { hitungNilaiAset, formatRupiah, formatTanggalID, buatNomorDokumen } from "../../utils/format";
import { getNama, getDepartemen, getUpliner } from "../../utils/data";

// Judul dokumen SELALU "Serah Terima", apa pun jenis form yang dipilih.
const JUDUL_FORM = "FORM SERAH TERIMA ASET";
const DEPARTEMEN_PENGIRIM = "Aset"; // pihak yang menyerahkan = departemen Aset
const TANGGAL_REVISI = "13 Oktober 2025";
// No. Form di kotak kop = nomor form SOP, PERMANEN (tidak ikut nomor surat berjalan)
const NOMOR_FORM_SOP = "008/FRM/DIKA/X/2025";
// Nomor surat berjalan (di bagian "No"), contoh: 00001/X/2026
const NOMOR_OPTS = { pad: 5 };

const VARIANTS = {
  op: {
    id: "op",
    label: "OP",
    judulKartu: "Form Serah Terima (OP) - Sesuai SOP",
    denganUpliner: false,
    denganKeterangan: true,
  },
  tele: {
    id: "tele",
    label: "TELE",
    judulKartu: "Form TELE (3 TTD dengan Upliner) - Sesuai SOP",
    denganUpliner: true,
    denganKeterangan: false,
  },
};

const INITIAL_INPUTS = {
  jenis: JENIS_FORM.SERAH_TERIMA,
  kode: "",
  no: "001",
  penerima: "",
  pengirim: "",
};

/** Dokumen kosong (sebelum Generate) */
const buatDokumenKosong = () => ({
  blank: true,
  ...INITIAL_INPUTS,
  noFull: buatNomorDokumen(INITIAL_INPUTS.no, NOMOR_OPTS),
  aset: {},
  nilai: {},
  penerima: {},
  pengirim: {},
  upliner: null,
});

export default function FormAsetSOP({ variant = "op", getAset, getKaryawan, employeeIndex, logo }) {
  const cfg = VARIANTS[variant];
  const [inputs, setField] = useFormInputs(INITIAL_INPUTS);
  const [data, setData] = useState(buatDokumenKosong);

  const generate = () => {
    const aset = getAset(inputs.kode) || { "Kode Aset": inputs.kode };
    const fallback = (nik) => ({ NIK: nik, Name: nik || "-" });
    const penerima = getKaryawan(inputs.penerima) || fallback(inputs.penerima);
    const pengirim = getKaryawan(inputs.pengirim) || fallback(inputs.pengirim);

    setData({
      blank: false,
      ...inputs,
      noFull: buatNomorDokumen(inputs.no, NOMOR_OPTS),
      tglHariIni: formatTanggalID(new Date()),
      aset,
      nilai: hitungNilaiAset(aset["Harga Pembelian"], aset["Tanggal Pembelian"]),
      penerima,
      pengirim,
      upliner: getUpliner(penerima, employeeIndex),
    });
  };

  const areaId = `print-area-${cfg.id}`;
  const filename = `Form_${cfg.label}_${data.blank ? "Kosong" : inputs.kode || "Aset"}`;

  return (
    <div>
      <FormControls title={cfg.judulKartu} buttonLabel={`Generate Form ${cfg.label}`} onGenerate={generate}>
        <JenisSelect value={inputs.jenis} onChange={setField("jenis")} />
        <Field label="Kode Aset">
          <input value={inputs.kode} onChange={setField("kode")} placeholder="Contoh: C1.96.000045" />
        </Field>
        <Field label="No Urut Surat">
          <input value={inputs.no} onChange={setField("no")} />
        </Field>
        <Field label="NIK Penerima">
          <input value={inputs.penerima} onChange={setField("penerima")} />
        </Field>
        <Field label="NIK Pengirim (GA/Aset)">
          <input value={inputs.pengirim} onChange={setField("pengirim")} />
        </Field>
      </FormControls>

      <PreviewWrapper areaId={areaId} filename={filename}>
        <div id={areaId}>
          <DocPage size="a4">
            <Halaman1 cfg={cfg} data={data} logo={logo} />
          </DocPage>
          <DocPage size="a4" pageBreak>
            <DocHeader logo={logo} title={JUDUL_FORM} noForm={NOMOR_FORM_SOP} tanggalRev={TANGGAL_REVISI} />
            <KetentuanAset />
            <div style={{ marginTop: 14 }}>
              <SignatureTable fontSize={10} space={95} signers={signersSerahTerima(cfg, data)} />
            </div>
          </DocPage>
        </div>
      </PreviewWrapper>
    </div>
  );
}

// ---------- Tanda tangan ----------
const namaTtd = (data, emp) => (data.blank ? DOT_SHORT : getNama(emp));

function signersSerahTerima(cfg, data) {
  const list = [{ name: namaTtd(data, data.penerima), caption: "Pemegang Aset" }];
  if (cfg.denganUpliner) {
    list.push({
      name: data.blank ? DOT_SHORT : data.upliner ? getNama(data.upliner) : "-",
      caption: "Upliner Pemegang Aset",
    });
  }
  list.push({ name: namaTtd(data, data.pengirim), caption: "Aset" });
  return list;
}

function signersPengembalian(cfg, data, isKembali) {
  const nama = (emp) => (isKembali ? getNama(emp) : DOT_SHORT);
  const list = [{ name: nama(data.penerima), caption: "Pemegang Aset" }];
  if (cfg.denganUpliner) {
    list.push({
      name: isKembali && data.upliner ? getNama(data.upliner) : DOT_SHORT,
      caption: "Upliner Pemegang Aset",
    });
  }
  list.push({ name: nama(data.pengirim), caption: "Aset" });
  return list;
}

// ---------- Halaman 1 ----------
function Halaman1({ cfg, data, logo }) {
  const { aset, nilai, penerima, pengirim, upliner, blank } = data;
  const isKembali = !blank && data.jenis === JENIS_FORM.PENGEMBALIAN;
  const t = (v, fb) => tampil(blank, v, fb);
  const kolom = { width: "50%", verticalAlign: "top", fontSize: 11 };

  const partyRows = (emp, dept, keterangan) => {
    const rows = [
      ["Nama", t(getNama(emp))],
      ["NIK", t(emp.NIK)],
      ["Departemen", dept],
    ];
    if (keterangan) rows.push(["Keterangan", DOT_LINE]);
    return rows;
  };

  const rowsPenerima = partyRows(penerima, t(getDepartemen(penerima)), cfg.denganKeterangan);
  if (cfg.denganUpliner) {
    rowsPenerima.push([
      "Upliner",
      blank ? DOT_SHORT : upliner ? `${getNama(upliner)}${upliner.NIK ? ` (${upliner.NIK})` : ""}` : "-",
    ]);
  }
  const rowsPengirim = partyRows(pengirim, DEPARTEMEN_PENGIRIM, cfg.denganKeterangan);

  const kembaliRows = (emp, dept) =>
    isKembali
      ? [["Nama", getNama(emp)], ["NIK", emp.NIK || "-"], ["Departemen", dept]]
      : [["Nama", DOT_LINE], ["NIK", DOT_LINE], ["Departemen", DOT_LINE]];

  const rp = (v) => (blank ? "Rp ......................" : v ? formatRupiah(v) : "-");

  return (
    <>
      <DocHeader logo={logo} title={JUDUL_FORM} noForm={NOMOR_FORM_SOP} tanggalRev={TANGGAL_REVISI} />

      {/* Informasi aset */}
      <table className="content-table" style={{ width: "100%", marginBottom: 6, fontSize: 11 }}>
        <tbody>
          <tr>
            <td style={{ width: "15%" }}><strong>No</strong></td>
            <td style={{ width: "35%" }}>: {data.noFull}</td>
            <td style={{ width: "18%" }}>Tgl. Pembelian</td>
            <td style={{ width: "32%" }}>: {blank ? DOT_SHORT : formatTanggalID(aset["Tanggal Pembelian"])}</td>
          </tr>
          <tr>
            <td>Jenis Barang</td>
            <td>: {t(aset["Sub Kategori Aset"] || aset["Kategori Aset"])}</td>
            <td>Harga Pembelian</td>
            <td>: {rp(nilai.hargaBeli)}</td>
          </tr>
          <tr>
            <td>Kondisi Barang</td>
            <td>: {t(aset["Kondisi Aset"])}</td>
            <td>Harga Buku</td>
            <td>: {blank ? rp() : formatRupiah(nilai.nilaiBuku)}</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td>Harga Pasar</td>
            <td>: {blank ? rp() : formatRupiah(nilai.nilaiPasar)}</td>
          </tr>
        </tbody>
      </table>

      <table className="content-table" style={{ width: "100%", marginBottom: 8, fontSize: 11 }}>
        <tbody>
          <tr>
            <td style={{ width: "15%" }}>Merk &amp; Spek</td>
            <td>: {blank ? DOT_LINE : `${aset["Merk"] || "-"} - ${aset["Spesifikasi"] || "-"}`}</td>
          </tr>
          <tr>
            <td>No. Seri</td>
            <td>: {t(aset["Serial Number"], "-")}</td>
          </tr>
          <tr>
            <td>Kode Aset</td>
            <td>: {t(aset["Kode Aset"])}</td>
          </tr>
          <tr>
            <td>Keterangan</td>
            <td>: {t(aset["Note Kondisi Aset"] || aset["Catatan Pembelian"])}</td>
          </tr>
        </tbody>
      </table>

      {/* Serah terima */}
      <p style={{ fontSize: 11, margin: "0 0 5px" }}>
        Telah diterima dalam keadaan baik dan berfungsi normal, tanggal :{" "}
        {!blank && !isKembali ? data.tglHariIni : "...................."}
      </p>
      <table className="content-table" style={{ width: "100%", marginBottom: 6, fontSize: 11 }}>
        <tbody>
          <tr>
            <td style={kolom}><strong>Diterima oleh :</strong></td>
            <td style={kolom}><strong>Diserahkan oleh :</strong></td>
          </tr>
          <tr>
            <td style={kolom}><InfoRows rows={rowsPenerima} /></td>
            <td style={kolom}><InfoRows rows={rowsPengirim} /></td>
          </tr>
        </tbody>
      </table>
      <SignatureTable fontSize={10} space={78} signers={signersSerahTerima(cfg, data)} />

      <div style={{ fontWeight: "bold", fontSize: 11 }}>Bersama ini Saya menyatakan, bahwa:</div>
      <ul style={{ fontSize: 10.5, paddingLeft: 20, margin: "2px 0 6px" }}>
        <li>Telah menerima dalam keadaan baik aset PT. DIKA seperti disebutkan diatas</li>
        <li>Bertanggung jawab penuh atas penggunaan dan pemeliharaan aset tersebut</li>
        <li>Mengerti dan memahami Ketentuan Kerusakan Dan Kehilangan Aset Yang Digunakan Staf</li>
        <li>Bersedia dan sanggup melakukan penggantian dengan biaya sendiri sesuai dengan Panduan</li>
        <li>Saya akan mengembalikan aset dengan kondisi baik kepada PT. DIKA bila sudah tidak bekerja lagi di PT. DIKA</li>
      </ul>

      <hr style={{ borderTop: "2px solid #000", margin: "6px 0" }} />

      {/* Pengembalian */}
      <div style={{ fontWeight: "bold", fontSize: 11 }}>Pengembalian Aset :</div>
      <p style={{ fontSize: 11, margin: "3px 0 5px" }}>
        Telah diterima dalam keadaan baik dan berfungsi normal, tanggal :{" "}
        <strong>{isKembali ? data.tglHariIni : "...................."}</strong>
      </p>
      <table className="content-table" style={{ width: "100%", marginBottom: 6, fontSize: 11 }}>
        <tbody>
          <tr>
            <td style={kolom}><strong>Dikembalikan oleh,</strong></td>
            <td style={kolom}><strong>Diterima oleh,</strong></td>
          </tr>
          <tr>
            <td style={kolom}>
              <InfoRows rows={kembaliRows(penerima, getDepartemen(penerima))} />
            </td>
            <td style={kolom}>
              <InfoRows rows={kembaliRows(pengirim, DEPARTEMEN_PENGIRIM)} />
            </td>
          </tr>
        </tbody>
      </table>
      <SignatureTable
        fontSize={10}
        space={78}
        marginBottom={0}
        signers={signersPengembalian(cfg, data, isKembali)}
      />
    </>
  );
}
