// Form Tanda Terima & Serah Terima (A5)
// Dokumen tampil kosong saat menu dibuka; tombol Generate mengisinya otomatis.
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
  InfoRows,
  SignatureTable,
  useFormInputs,
  tampil,
} from "./FormParts";
import { formatTanggalID, buatNomorDokumen } from "../../utils/format";
import { getNama, getDepartemen } from "../../utils/data";

// Judul tetap "FORM TANDA TERIMA" apa pun jenis form yang dipilih.
const JUDUL_FORM = "FORM TANDA TERIMA";
const NOMOR_OPTS = { pad: 3, prefix: "FRM/DIKA/" }; // contoh: 008/FRM/DIKA/X/2026
const LOGO_RATIO = 81 / 251;
const sectionTitle = {
  fontWeight: "bold",
  fontSize: 10,
  marginTop: 5,
  marginBottom: 3,
  borderBottom: "1px solid #000",
};

const INITIAL_INPUTS = {
  jenis: JENIS_FORM.SERAH_TERIMA,
  perihal: "Serah Terima / Pengembalian",
  no: "008",
  kode: "",
  pengirim: "",
  penerima: "",
};

const buatDokumenKosong = () => ({
  blank: true,
  ...INITIAL_INPUTS,
  noFull: buatNomorDokumen(INITIAL_INPUTS.no, NOMOR_OPTS),
  tglHariIni: DOT_SHORT,
  aset: {},
  penerima: {},
  pengirim: {},
});

export default function FormTandaTerima({ getAset, getKaryawan, logo }) {
  const [inputs, setField] = useFormInputs(INITIAL_INPUTS);
  const [d, setData] = useState(buatDokumenKosong);

  const generate = () => {
    const fallback = (nik) => ({ NIK: nik, Name: nik || "-" });
    setData({
      blank: false,
      ...inputs,
      noFull: buatNomorDokumen(inputs.no, NOMOR_OPTS),
      tglHariIni: formatTanggalID(new Date()),
      aset: getAset(inputs.kode) || { "Kode Aset": inputs.kode },
      penerima: getKaryawan(inputs.penerima) || fallback(inputs.penerima),
      pengirim: getKaryawan(inputs.pengirim) || fallback(inputs.pengirim),
    });
  };

  const blank = d.blank;
  const isKembali = !blank && d.jenis === JENIS_FORM.PENGEMBALIAN;
  const isi = (nilai) => (isKembali ? nilai : DOT_LINE);
  const t = (v, fb) => tampil(blank, v, fb);

  return (
    <div>
      <FormControls
        title="Tanda Terima & Serah Terima (A5) - Sesuai SOP"
        buttonLabel="Generate A5"
        onGenerate={generate}>
        <JenisSelect value={inputs.jenis} onChange={setField("jenis")} />
        <Field label="Perihal">
          <input value={inputs.perihal} onChange={setField("perihal")} />
        </Field>
        <Field label="No Form">
          <input value={inputs.no} onChange={setField("no")} />
        </Field>
        <Field label="Kode Aset">
          <input value={inputs.kode} onChange={setField("kode")} />
        </Field>
        <Field label="NIK Pengirim">
          <input value={inputs.pengirim} onChange={setField("pengirim")} />
        </Field>
        <Field label="NIK Penerima">
          <input value={inputs.penerima} onChange={setField("penerima")} />
        </Field>
      </FormControls>

      <PreviewWrapper
        areaId="print-area-a5"
        filename={`TandaTerima_${blank ? "Kosong" : inputs.kode || "Aset"}`}
        size="a5">
        <div id="print-area-a5">
          <DocPage size="a5">
            <table className="table-bordered header-box" style={{ width: "100%", marginBottom: 8 }}>
              <tbody>
                <tr>
                  <td style={{ width: "30%", textAlign: "center", verticalAlign: "middle", padding: 6 }}>
                    <img src={logo} alt="Logo DIKA" width={90} height={Math.round(90 * LOGO_RATIO)} />
                  </td>
                  <td style={{ width: "70%", textAlign: "center", verticalAlign: "middle" }}>
                    <h5 style={{ fontSize: 13, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>
                      {JUDUL_FORM}
                    </h5>
                    <div style={{ fontSize: 10.5, marginTop: 2 }}>{d.noFull}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={sectionTitle}>I. INFORMASI TANDA TERIMA</div>
            <div style={{ fontSize: 9.5, marginBottom: 6 }}>
              <InfoRows labelWidth="15%" rows={[["Perihal", d.perihal]]} />
            </div>

            <table className="table-bordered" style={{ width: "100%", marginBottom: 6, fontSize: 9.5 }}>
              <tbody>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ width: "50%", textAlign: "center", padding: 3 }}>PENGIRIM</th>
                  <th style={{ width: "50%", textAlign: "center", padding: 3 }}>PENERIMA</th>
                </tr>
                <tr>
                  {[d.pengirim, d.penerima].map((emp, i) => (
                    <td key={i} style={{ padding: 4, verticalAlign: "top" }}>
                      Nama : {t(getNama(emp))}
                      <br />
                      NIK : {t(emp.NIK)}
                      <br />
                      Departemen : {t(getDepartemen(emp))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <div style={sectionTitle}>II. RINCIAN ASET / BARANG</div>
            <table className="table-bordered text-center" style={{ width: "100%", marginBottom: 6, fontSize: 9.5 }}>
              <thead style={{ backgroundColor: "#f8f9fa" }}>
                <tr>
                  <th style={{ width: "5%", padding: 3 }}>No</th>
                  <th style={{ width: "20%", padding: 3 }}>Kode Aset</th>
                  <th style={{ width: "35%", padding: 3 }}>Spesifikasi</th>
                  <th style={{ width: "20%", padding: 3 }}>No. Seri (S/N)</th>
                  <th style={{ width: "20%", padding: 3 }}>Kondisi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 4 }}>1</td>
                  <td style={{ padding: 4 }}>{t(d.aset["Kode Aset"])}</td>
                  <td style={{ padding: 4, textAlign: "left" }}>
                    {blank ? DOT_SHORT : `${d.aset["Merk"] || "-"} - ${d.aset["Spesifikasi"] || "-"}`}
                  </td>
                  <td style={{ padding: 4 }}>{t(d.aset["Serial Number"])}</td>
                  <td style={{ padding: 4 }}>{t(d.aset["Kondisi Aset"])}</td>
                </tr>
              </tbody>
            </table>

            <p style={{ fontSize: 9.5, margin: "0 0 5px" }}>
              Telah diterima dalam keadaan baik dan berfungsi normal pada tanggal :{" "}
              <strong>{!blank && !isKembali ? d.tglHariIni : "...................."}</strong>
            </p>

            <SignatureTable
              heading=""
              fontSize={9.5}
              space={48}
              signers={[
                { name: t(getNama(d.pengirim)), caption: "Diserahkan Oleh", sub: blank ? "" : getDepartemen(d.pengirim) },
                { name: t(getNama(d.penerima)), caption: "Diterima Oleh", sub: blank ? "" : getDepartemen(d.penerima) },
              ]}
            />

            <hr style={{ borderTop: "1.5px dashed #000", margin: "4px 0" }} />

            <div style={{ ...sectionTitle, backgroundColor: "#f1f1f1", padding: "2px 5px", borderBottom: "none" }}>
              III. PENGEMBALIAN ASET (DIISI SAAT ASET DIKEMBALIKAN)
            </div>
            <p style={{ fontSize: 9.5, margin: "0 0 5px" }}>
              Aset telah dikembalikan dan diterima dalam keadaan baik dan berfungsi normal pada
              tanggal : <strong>{isKembali ? d.tglHariIni : "...................."}</strong>
            </p>
            <table className="content-table" style={{ width: "100%", marginBottom: 5, fontSize: 9 }}>
              <tbody>
                <tr>
                  <td style={{ width: "50%" }}><strong>Dikembalikan oleh:</strong></td>
                  <td style={{ width: "50%" }}><strong>Diterima oleh:</strong></td>
                </tr>
                <tr>
                  <td style={{ verticalAlign: "top" }}>
                    <InfoRows
                      rows={[
                        ["Nama", isi(getNama(d.penerima))],
                        ["NIK", isi(d.penerima.NIK || "-")],
                        ["Departemen", isi(getDepartemen(d.penerima))],
                      ]}
                    />
                  </td>
                  <td style={{ verticalAlign: "top" }}>
                    <InfoRows
                      rows={[
                        ["Nama", isi(getNama(d.pengirim))],
                        ["NIK", isi(d.pengirim.NIK || "-")],
                        ["Departemen", isi(getDepartemen(d.pengirim))],
                      ]}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <SignatureTable
              fontSize={9}
              space={48}
              marginBottom={0}
              signers={[
                { name: isKembali ? getNama(d.penerima) : DOT_SHORT, caption: "Tanda Tangan Pengembali" },
                { name: isKembali ? getNama(d.pengirim) : DOT_SHORT, caption: "Tanda Tangan Penerima" },
              ]}
            />
          </DocPage>
        </div>
      </PreviewWrapper>
    </div>
  );
}
