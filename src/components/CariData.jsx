import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import Pagination from "./ui/Pagination";
import { formatRupiah, formatTanggalID } from "../utils/format";
import { getDepartemen, getUpliner, getTanggalKeluar } from "../utils/data";

const PAGE_SIZE = 10;

const includes = (value, q) => (value || "").toLowerCase().includes(q);

const cariAset = (assets, q) =>
  assets.filter(
    (a) =>
      includes(a["Kode Aset"], q) ||
      includes(a.Merk, q) ||
      includes(a.Spesifikasi, q) ||
      includes(a["Serial Number"], q) ||
      includes(a.Username, q) ||
      includes(a["Kategori Aset"], q) ||
      includes(a["Sub Kategori Aset"], q),
  );

const cariKaryawan = (employees, q) =>
  employees.filter((e) => includes(e.NIK, q) || includes(e.Name, q));

/** Sel nama upliner: otomatis diambil dari NIK upliner karyawan. */
function UplinerCell({ employee, employeeIndex }) {
  const up = getUpliner(employee, employeeIndex);
  if (!up) return <span className="muted">-</span>;
  return (
    <div>
      <strong>{up.Name || "Tidak ditemukan"}</strong>
      <div className="muted small">NIK: {up.NIK}</div>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const s = (status || "").toUpperCase();
  const cls = s === "ACTIVE" ? "badge-green" : s ? "badge-gray" : "";
  return s ? <span className={`badge ${cls}`}>{s}</span> : <span className="muted">-</span>;
};

export default function CariData({ assets, employees, employeeIndex }) {
  const [type, setType] = useState("aset");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(null); // { q, type }
  const [page, setPage] = useState(1);

  const results = useMemo(() => {
    if (!submitted) return [];
    const q = submitted.q.toLowerCase();
    return submitted.type === "aset" ? cariAset(assets, q) : cariKaryawan(employees, q);
  }, [submitted, assets, employees]);

  const doSearch = () => {
    const q = query.trim();
    setPage(1);
    setSubmitted(q ? { q, type } : null);
  };

  const changeType = (value) => {
    setType(value);
    setQuery("");
    setSubmitted(null);
    setPage(1);
  };

  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const shownType = submitted?.type;

  return (
    <div className="card no-print">
      <h3>Pencarian Data</h3>

      <div className="search-form">
        <select value={type} onChange={(e) => changeType(e.target.value)}>
          <option value="aset">Data Aset</option>
          <option value="karyawan">Data Karyawan</option>
        </select>
        <input
          value={query}
          placeholder={
            type === "aset"
              ? "Cari kode aset, merk, spesifikasi, serial number, pemegang..."
              : "Cari NIK atau nama karyawan..."
          }
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
        />
        <button className="btn-search" onClick={doSearch}>
          <Search size={16} /> Cari
        </button>
      </div>

      {submitted && (
        <div className="result-summary">
          Ditemukan <strong>{results.length.toLocaleString("id-ID")}</strong> data untuk “{submitted.q}”
        </div>
      )}

      <div className="search-result table-responsive">
        {results.length > 0 && shownType === "aset" && (
          <table className="result-table">
            <thead>
              <tr>
                <th>Kode Aset</th><th>Kategori</th><th>Merk / Spesifikasi</th>
                <th>Pemegang</th><th>Harga Pembelian</th><th>Tgl Pembelian</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((a, i) => (
                <tr key={`${a["Kode Aset"]}-${i}`}>
                  <td><strong>{a["Kode Aset"]}</strong></td>
                  <td>{a["Sub Kategori Aset"] || a["Kategori Aset"] || "-"}</td>
                  <td>{a.Merk || "-"} / {a.Spesifikasi || "-"}</td>
                  <td>{a.Username || "-"}</td>
                  <td>{a["Harga Pembelian"] ? formatRupiah(a["Harga Pembelian"]) : "-"}</td>
                  <td>{formatTanggalID(a["Tanggal Pembelian"])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {results.length > 0 && shownType === "karyawan" && (
          <table className="result-table">
            <thead>
              <tr>
                <th>NIK</th><th>Nama Lengkap</th><th>Departemen</th><th>Unit</th>
                <th>Status</th><th>Tgl Join</th><th>Tgl Keluar</th>
                <th>Upliner</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((e, i) => (
                <tr key={`${e.NIK}-${i}`}>
                  <td><strong>{e.NIK}</strong></td>
                  <td>{e.Name || "-"}</td>
                  <td>{getDepartemen(e)}</td>
                  <td>{e.Unit || "-"}</td>
                  <td><StatusBadge status={e.Status} /></td>
                  <td className="nowrap">{formatTanggalID(e.Join_Date)}</td>
                  <td className="nowrap">{formatTanggalID(getTanggalKeluar(e))}</td>
                  <td><UplinerCell employee={e} employeeIndex={employeeIndex} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {submitted && results.length === 0 && (
          <div className="not-found">Data tidak ditemukan untuk pencarian “{submitted.q}”</div>
        )}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={results.length} onChange={setPage} />
    </div>
  );
}
