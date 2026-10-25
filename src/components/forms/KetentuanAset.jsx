// Halaman 2 Form OP / TELE: Ketentuan kehilangan & kerusakan aset
import React from "react";

const KEHILANGAN_LALAI = [
  "Meninggalkan perangkat tanpa pengawasan",
  "Meninggalkan perangkat di tempat umum",
];
const KEHILANGAN_BUKAN_LALAI = [
  "Perampokan yang melibatkan kekerasan",
  "Pencurian yang melibatkan pembobolan secara paksa",
  "Bencana Alam",
];
const KERUSAKAN_LALAI = [
  "Layar pecah",
  "Body perangkat pecah, retak, dan engsel patah",
  "Huruf pada keyboard lepas",
  "Perangkat tersiram air/terkena cairan",
  "Perangkat dan/atau charger terbakar",
  "Batere perangkat mengembang akibat charger terpasang sepanjang jam pemakaian laptop",
  "Perangkat terjatuh sehingga terdapat kerusakan pada perangkat",
  "Tidak mengikut panduan pemeliharaan Laptop",
  "Membongkar fisik perangkat tanpa persetujuan dari pihak yang berwenang",
  "Instalasi program atau memasang perangkat tambahan tanpa izin dari pihak berwenang",
  "Perangkat tersimpan tanpa pengawasan",
  "Perangkat dirusak oleh faktor kesengajaan",
  "Perkelahian yang mengakibatkan kerusakan perangkat",
  "Menggunakan aset untuk kegiatan diluar kebutuhan pekerjaan dan terjadi kerusakan",
  "Perangkat dipinjamkan kepada pihak yang tidak berkepentingan",
  "Perangkat digunakan atas kepentingan pribadi",
];
const KERUSAKAN_BUKAN_LALAI = [
  "Faktor usia perangkat",
  "Staf mengalami bencana alam yang mengakibatkan kerusakan pada perangkat",
  "Staf mengalami kecelakaan dalam waktu perjalanan tugas yang berakibat kerusakan pada perangkat",
];

const BIAYA_LALAI = [
  ["1", "Hilang", "Kelalaian Staf", "Nilai Buku", "-",
    "Staf membayar dari Nilai Buku yang tercatat di accounting atau nilai harga pasar mana yang tertinggi"],
  ["2", "Rusak", "Kelalaian Staf", "Biaya Perbaikan", "-",
    "Biaya perbaikan ditanggung 100% oleh staf"],
];
const BIAYA_BUKAN_LALAI = [
  ["1", "Hilang", "Bukan Kelalaian Staf", "-", "100%",
    "Dasar pertanggungan asuransi dari harga aset dengan spesifikasi yang sama"],
  ["2", "Rusak", "Bukan Kelalaian Staf", "-", "100%",
    "Hal yang disebabkan karena pemakaian"],
];

const th = { padding: 4, backgroundColor: "#ffc107" };
const td = { padding: 4 };

function SubHeading({ children }) {
  return (
    <div style={{ marginLeft: 10, marginTop: 4 }}>
      <strong>{children}</strong>
    </div>
  );
}

function AlphaList({ items, gap = 3 }) {
  return (
    <ol type="a" style={{ paddingLeft: 28, margin: 0, marginBottom: gap }}>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ol>
  );
}

function BiayaTable({ rows }) {
  return (
    <table
      className="table-bordered text-center align-middle"
      style={{ width: "100%", fontSize: "8.5px", marginBottom: 6 }}>
      <thead>
        <tr>
          <th style={th}>No</th>
          <th style={th}>Kondisi</th>
          <th style={th}>Penyebab</th>
          <th colSpan="2" style={th}>
            Beban Pertanggungan Aset
            <br />
            Staf &nbsp;|&nbsp; Perusahaan
          </th>
          <th style={th}>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([no, kondisi, sebab, staf, perusahaan, ket]) => (
          <tr key={no}>
            <td style={td}>{no}</td>
            <td style={td}>{kondisi}</td>
            <td style={td}>{sebab}</td>
            <td style={td}>{staf}</td>
            <td style={td}>{perusahaan}</td>
            <td style={{ ...td, textAlign: "left" }}>{ket}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function KetentuanAset() {
  return (
    <>
      <div
        style={{
          fontWeight: "bold",
          fontSize: 13,
          textAlign: "center",
          textDecoration: "underline",
          textUnderlineOffset: 3,
          margin: "8px 0",
        }}>
        KETENTUAN KEHILANGAN DAN KERUSAKAN ASET
      </div>

      <div style={{ fontSize: "9.5px", lineHeight: 1.2, textAlign: "justify" }}>
        <div style={{ fontWeight: "bold", fontSize: 11, marginTop: 6 }}>
          I. Definisi Kehilangan &amp; Kerusakan Aset
        </div>

        <div style={{ fontWeight: "bold", marginTop: 8 }}>1. Kehilangan</div>
        <SubHeading>1.1 Kehilangan yang disebabkan Kelalaian Staf</SubHeading>
        <AlphaList items={KEHILANGAN_LALAI} />
        <SubHeading>1.2 Kehilangan yang disebabkan Bukan Kelalaian Staf</SubHeading>
        <AlphaList items={KEHILANGAN_BUKAN_LALAI} />

        <div style={{ fontWeight: "bold", marginTop: 8 }}>2. Kerusakan</div>
        <SubHeading>2.1 Kerusakan yang disebabkan Kelalaian Staf</SubHeading>
        <AlphaList items={KERUSAKAN_LALAI} />
        <SubHeading>2.2 Kerusakan yang disebabkan Bukan Kelalaian Staf</SubHeading>
        <AlphaList items={KERUSAKAN_BUKAN_LALAI} gap={6} />

        <div style={{ fontWeight: "bold", fontSize: 11, marginTop: 8, marginBottom: 3 }}>
          II. Biaya Pertanggungan Aset
        </div>
        <div style={{ fontWeight: "bold", margin: "5px 0" }}>
          1. Yang disebabkan oleh kelalaian staf
        </div>
        <BiayaTable rows={BIAYA_LALAI} />
        <div style={{ fontWeight: "bold", margin: "10px 0 5px" }}>
          2. Yang disebabkan bukan kelalaian staf
        </div>
        <BiayaTable rows={BIAYA_BUKAN_LALAI} />

        <div style={{ marginTop: 6 }}>
          <strong>Note:</strong>
          <ul style={{ paddingLeft: 20, margin: "0 0 3px" }}>
            <li>Identifikasi kerusakan dinilai dari IT Support dan Vendor</li>
            <li>Dasar pertanggungan asuransi mengikuti ketentuan asuransi</li>
          </ul>
          <div>
            2. Jika Nilai buku = Rp.0,- maka dasar penggantian nilai perangkat yang
            hilang diakibatkan kelalaian staff sesuai harga pasar.
          </div>
          <div>
            3. Jika harga pasar perangkat mempunyai nilai &lt; Rp.500.000, maka staff
            tetap diwajibkan melakukan penggantian kerugian perangkat hilang karena
            kelalaian staff senilai Rp.500.000
          </div>
        </div>
      </div>
    </>
  );
}
