// ============================================================
// Form Bulky: serah terima / pengembalian banyak aset sekaligus (A4 landscape)
// Dokumen tampil kosong saat menu dibuka; tombol Generate mengisinya otomatis.
// ============================================================
import React, { useState } from "react";
import {
  DOT_SHORT,
  Field,
  FormControls,
  PreviewWrapper,
  DocPage,
  DocHeaderCentered,
  InfoRows,
  SignatureTable,
  useFormInputs,
  tampil,
} from "./FormParts";
import {
  formatAngka,
  formatTanggalID,
  formatHariTanggal,
  buatNomorDokumen,
} from "../../utils/format";
import { getNama, getDepartemen, gabungMerkSpek } from "../../utils/data";

// No. Form di kop = nomor form SOP, PERMANEN (bukan nomor surat berjalan)
const NOMOR_FORM_SOP = "005/FRM/DIKA/VII/2025";
// Nomor surat berjalan, contoh: 00107/X/FSTA/2026
const NOMOR_OPTS = { pad: 5, akhiran: "FSTA" };
const DEPARTEMEN_PENGIRIM = "Aset"; // pihak yang menyerahkan = divisi Aset

const MIN_BARIS = 3;
const BARIS_PER_HALAMAN = 8; // lebih dari ini otomatis lanjut ke halaman berikutnya (data tidak terpotong)
const cell = { padding: 4 };

const INITIAL_INPUTS = {
  jenis: "Serah Terima",
  no: "001",
  kode: "",
  penerima: "",
  pengirim: "",
  cabang: "",
  lokasi: "",
};

/** Dokumen kosong (sebelum Generate) */
const buatDokumenKosong = () => ({
  blank: true,
  ...INITIAL_INPUTS,
  noFull: buatNomorDokumen(INITIAL_INPUTS.no, NOMOR_OPTS),
  hariTanggal: DOT_SHORT,
  asetList: [],
  penerima: {},
  pengirim: {},
  cabangTampil: "",
  lokasiTampil: "",
});

const bagiHalaman = (list, size) => {
  const pages = [];
  for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size));
  return pages.length ? pages : [[]];
};

export default function FormBulky({ getAset, getKaryawan, logo }) {
  const [inputs, setField] = useFormInputs(INITIAL_INPUTS);
  const [data, setData] = useState(buatDokumenKosong);
  const halaman = bagiHalaman(data.asetList, BARIS_PER_HALAMAN);

  const generate = () => {
    const kodeList = inputs.kode.split(",").map((k) => k.trim()).filter(Boolean);
    const fallback = (nik) => ({ NIK: nik, Name: nik || "-" });
    const penerima = getKaryawan(inputs.penerima) || fallback(inputs.penerima);
    setData({
      blank: false,
      ...inputs,
      noFull: buatNomorDokumen(inputs.no, NOMOR_OPTS),
      hariTanggal: formatHariTanggal(new Date()),
      asetList: kodeList.map((k) => getAset(k) || { "Kode Aset": k, notFound: true }),
      penerima,
      pengirim: getKaryawan(inputs.pengirim) || fallback(inputs.pengirim),
      // Cabang: isian form, jika kosong ambil dari data karyawan. Lokasi: isian form.
      cabangTampil: inputs.cabang.trim() || penerima.Branch || "-",
      lokasiTampil: inputs.lokasi.trim() || "-",
    });
  };

  const isKembali = !data.blank && data.jenis === "Pengembalian";
  const judul = isKembali ? "FORM PENGEMBALIAN ASET" : "FORM SERAH TERIMA ASET";
  const t = (v, fb) => tampil(data.blank, v, fb);

  const divisiPenerima = t(getDepartemen(data.penerima));
  const divisiPengirim = data.blank ? DOT_SHORT : DEPARTEMEN_PENGIRIM;
  const ttdPenerima = {
    name: t(getNama(data.penerima)),
    caption: `Divisi: ${divisiPenerima}`,
  };
  const ttdPengirim = {
    name: t(getNama(data.pengirim)),
    caption: `Divisi: ${divisiPengirim}`,
  };
  // Serah terima: penyerah (Aset) di kiri. Pengembalian: pemegang aset yang mengembalikan di kiri.
  const signers = isKembali
    ? [
        { ...ttdPenerima, title: "Yang Mengembalikan," },
        { ...ttdPengirim, title: "Yang Menerima," },
      ]
    : [
        { ...ttdPengirim, title: "Yang Menyerahkan," },
        { ...ttdPenerima, title: "Yang Menerima," },
      ];

  return (
    <div>
      <FormControls
        title="Form Bulky (Multiple Aset) - Sesuai SOP"
        buttonLabel="Generate Form Bulky"
        onGenerate={generate}>
        <Field label="Jenis Form">
          <select value={inputs.jenis} onChange={setField("jenis")}>
            <option value="Serah Terima">Form Serah Terima</option>
            <option value="Pengembalian">Form Pengembalian</option>
          </select>
        </Field>
        <Field label="No Urut Surat">
          <input value={inputs.no} onChange={setField("no")} />
        </Field>
        <Field label="Kode Aset (pisahkan dengan koma: C1.01, C1.02)" wide>
          <input value={inputs.kode} onChange={setField("kode")} />
        </Field>
        <Field label="NIK Penerima">
          <input value={inputs.penerima} onChange={setField("penerima")} />
        </Field>
        <Field label="NIK Penyerah">
          <input value={inputs.pengirim} onChange={setField("pengirim")} />
        </Field>
        <Field label="Cabang (kosong = otomatis dari data karyawan)">
          <input value={inputs.cabang} onChange={setField("cabang")} placeholder="Contoh: DIKA 2" />
        </Field>
        <Field label="Lokasi">
          <input value={inputs.lokasi} onChange={setField("lokasi")} placeholder="Contoh: Jakarta" />
        </Field>
      </FormControls>

      <PreviewWrapper
        areaId="print-area-bulky"
        filename={`Form_Bulky_${data.blank ? "Kosong" : inputs.penerima || "Aset"}`}
        size="a4l">
        <div id="print-area-bulky">
          {halaman.map((rows, idx) => {
            const awal = idx === 0;
            const akhir = idx === halaman.length - 1;
            return (
              <DocPage key={idx} size="a4l" pageBreak={!awal}>
                <DocHeaderCentered logo={logo} title={judul} noForm={NOMOR_FORM_SOP} />

                {awal && (
                  <>
                    <div style={{ fontSize: 11, marginBottom: 6 }}>
                      No : {data.noFull}
                      <br />
                      Pada hari {data.hariTanggal}, yang bertandatangan di bawah ini:
                    </div>

                    <div style={{ fontSize: 11, marginBottom: 6, width: "70%" }}>
                      <InfoRows
                        labelWidth="14%"
                        rows={[
                          ["Nama", t(getNama(data.penerima))],
                          ["NIK", t(data.penerima.NIK)],
                          ["Divisi", divisiPenerima],
                          ["Cabang", data.blank ? DOT_SHORT : data.cabangTampil],
                          ["Lokasi", data.blank ? DOT_SHORT : data.lokasiTampil],
                        ]}
                      />
                    </div>

                    <div style={{ fontSize: 11, marginBottom: 6, textAlign: "justify" }}>
                      {isKembali
                        ? "telah mengembalikan aset dengan kualifikasi seperti yang tercantum pada tabel di bawah ini dan setelah dilakukan pemeriksaan, maka kami menyatakan bahwa barang ini dalam keadaan/kondisi seperti yang tercantum pada tabel dibawah ini:"
                        : "telah menerima aset dengan kualifikasi seperti yang tercantum pada tabel di bawah ini dan setelah dilakukan pemeriksaan, maka kami menyatakan bahwa barang ini dalam keadaan/kondisi seperti yang tercantum pada tabel dibawah ini:"}
                    </div>
                  </>
                )}

                <TabelAset rows={rows} mulai={idx * BARIS_PER_HALAMAN} isiKosong={akhir} />

                {akhir && (
                  <>
                    <div style={{ fontSize: 9.5, marginBottom: 8 }}>
                      *) diisi dengan centang √<br />
                      **) Untuk barang yang diterima langsung oleh cabang wajib melampirkan foto barang
                    </div>
                    <SignatureTable heading="" space={60} marginBottom={0} signers={signers} />
                  </>
                )}
              </DocPage>
            );
          })}
        </div>
      </PreviewWrapper>
    </div>
  );
}

function TabelAset({ rows, mulai, isiKosong }) {
  const kosong = isiKosong ? Math.max(0, MIN_BARIS - rows.length) : 0;
  const lebar = ["4%", "14%", "14%", "26%", "11%", "11%", "6%", "7%", "7%"];
  return (
    <table
      className="table-bordered text-center"
      style={{ width: "100%", marginBottom: 6, fontSize: 10.5 }}>
      <thead style={{ backgroundColor: "#f2f2f2" }}>
        <tr>
          <th rowSpan="2" style={{ ...cell, width: lebar[0] }}>No</th>
          <th rowSpan="2" style={{ ...cell, width: lebar[1] }}>Nama Aset</th>
          <th rowSpan="2" style={{ ...cell, width: lebar[2] }}>Kode Aset</th>
          <th rowSpan="2" style={{ ...cell, width: lebar[3] }}>Spesifikasi</th>
          <th rowSpan="2" style={{ ...cell, width: lebar[4] }}>Tanggal Pembelian</th>
          <th rowSpan="2" style={{ ...cell, width: lebar[5] }}>Harga (Rp)</th>
          <th colSpan="3" style={cell}>Kondisi saat diterima *)</th>
        </tr>
        <tr>
          <th style={{ ...cell, width: lebar[6] }}>Baik</th>
          <th style={{ ...cell, width: lebar[7] }}>Rusak / Cacat</th>
          <th style={{ ...cell, width: lebar[8] }}>Komponen Tidak Lengkap</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((a, i) => (
          <tr key={a["Kode Aset"] + i}>
            <td style={cell}>{mulai + i + 1}</td>
            <td style={{ ...cell, textAlign: "left" }}>
              {a.notFound ? "Aset tidak ditemukan" : a["Sub Kategori Aset"] || a["Kategori Aset"] || "-"}
            </td>
            <td style={cell}>{a["Kode Aset"]}</td>
            <td style={{ ...cell, textAlign: "left" }}>{a.notFound ? "-" : gabungMerkSpek(a)}</td>
            <td style={cell}>{formatTanggalID(a["Tanggal Pembelian"])}</td>
            {/* Harga mengikuti kolom Harga Pembelian */}
            <td style={{ ...cell, textAlign: "right" }}>
              {a.notFound || !a["Harga Pembelian"] ? "-" : formatAngka(a["Harga Pembelian"])}
            </td>
            <td style={cell}>&nbsp;</td>
            <td style={cell}>&nbsp;</td>
            <td style={cell}>&nbsp;</td>
          </tr>
        ))}
        {Array.from({ length: kosong }).map((_, i) => (
          <tr key={`kosong-${i}`}>
            <td style={cell}>{mulai + rows.length + i + 1}</td>
            {Array.from({ length: 8 }).map((__, j) => (
              <td key={j} style={cell}>&nbsp;</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
