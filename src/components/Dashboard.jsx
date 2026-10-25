import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Package, Users, UserCheck } from "lucide-react";
import StatCard from "./ui/StatCard";
import { formatTanggalID } from "../utils/format";
import { asetTerbaru, karyawanTerbaru, groupCount, getDepartemen } from "../utils/data";

const TABLE_LIMIT = 10;
const GENDER_COLORS = { "Laki-laki": "#3b82f6", Perempuan: "#ec4899", "Tidak diisi": "#9ca3af" };
const BAR_COLOR = "#2563eb";

const nf = (n) => n.toLocaleString("id-ID");

function EmptyChart({ children }) {
  return <div className="empty-state">{children}</div>;
}

/** true jika lebar layar <= breakpoint (untuk menyesuaikan grafik di HP) */
const useNarrow = (breakpoint = 640) => {
  const query = `(max-width: ${breakpoint}px)`;
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setNarrow(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return narrow;
};

export default function Dashboard({ assets, employees }) {
  const [scope, setScope] = useState("ACTIVE"); // ACTIVE | ALL
  const narrow = useNarrow();

  const kategoriData = useMemo(
    () => groupCount(assets, (a) => a["Kategori Aset"]),
    [assets],
  );

  const karyawanScope = useMemo(
    () =>
      scope === "ACTIVE"
        ? employees.filter((e) => (e.Status || "").toUpperCase() === "ACTIVE")
        : employees,
    [employees, scope],
  );

  const genderData = useMemo(
    () => groupCount(karyawanScope, (e) => e.Gender || "Tidak diisi"),
    [karyawanScope],
  );

  const totalAktif = useMemo(
    () => employees.filter((e) => (e.Status || "").toUpperCase() === "ACTIVE").length,
    [employees],
  );

  const asetList = useMemo(() => asetTerbaru(assets, TABLE_LIMIT), [assets]);
  const karyawanList = useMemo(() => karyawanTerbaru(employees, TABLE_LIMIT), [employees]);

  return (
    <div className="dashboard no-print">
      {/* RINGKASAN */}
      <div className="stat-grid">
        <StatCard icon={Package} label="Total Aset" value={nf(assets.length)} color="#2563eb" />
        <StatCard icon={Users} label="Total Karyawan" value={nf(employees.length)} color="#8b5cf6" />
        <StatCard icon={UserCheck} label="Karyawan Aktif" value={nf(totalAktif)} color="#f59e0b" />
      </div>

      {/* GRAFIK */}
      <div className="chart-grid">
        <div className="card">
          <h3>Grafik Kategori Aset</h3>
          {kategoriData.length ? (
            <ResponsiveContainer width="100%" height={Math.max(300, kategoriData.length * 34)}>
              <BarChart data={kategoriData} layout="vertical" margin={{ left: 0, right: narrow ? 20 : 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={narrow ? 105 : 170} tick={{ fontSize: narrow ? 10 : 12 }} />
                <Tooltip formatter={(v) => [nf(v), "Jumlah Aset"]} />
                <Bar dataKey="value" name="Jumlah Aset" fill={BAR_COLOR} radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart>Data aset belum dimuat. Gunakan tombol Import CSV.</EmptyChart>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Grafik Karyawan Laki-laki &amp; Perempuan</h3>
            <div className="segmented">
              <button className={scope === "ACTIVE" ? "on" : ""} onClick={() => setScope("ACTIVE")}>Aktif</button>
              <button className={scope === "ALL" ? "on" : ""} onClick={() => setScope("ALL")}>Semua</button>
            </div>
          </div>
          {karyawanScope.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={narrow ? 50 : 70}
                  outerRadius={narrow ? 80 : 110}
                  paddingAngle={2}
                  label={narrow ? ({ percent }) => `${(percent * 100).toFixed(0)}%` : ({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                  {genderData.map((g) => (
                    <Cell key={g.name} fill={GENDER_COLORS[g.name] || "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [nf(v), n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart>Data karyawan belum dimuat. Gunakan tombol Import CSV.</EmptyChart>
          )}
        </div>
      </div>

      {/* TABEL */}
      <div className="chart-grid">
        <div className="card">
          <h3>Aset Terbaru ({TABLE_LIMIT})</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>Kode Aset</th><th>Kategori</th><th>Merk</th><th>Tgl Beli</th></tr>
              </thead>
              <tbody>
                {asetList.map((a) => (
                  <tr key={a["Kode Aset"]}>
                    <td><strong>{a["Kode Aset"]}</strong></td>
                    <td>{a["Sub Kategori Aset"] || a["Kategori Aset"]}</td>
                    <td>{a.Merk || "-"}</td>
                    <td>{formatTanggalID(a["Tanggal Pembelian"])}</td>
                  </tr>
                ))}
                {!asetList.length && (
                  <tr><td colSpan="4" className="empty-cell">Belum ada data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>Karyawan Terbaru ({TABLE_LIMIT})</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>NIK</th><th>Nama</th><th>Departemen</th><th>Tgl Join</th></tr>
              </thead>
              <tbody>
                {karyawanList.map((e) => (
                  <tr key={`${e.NIK}-${e.Number_Id}`}>
                    <td><strong>{e.NIK}</strong></td>
                    <td>{e.Name || "-"}</td>
                    <td>{getDepartemen(e)}</td>
                    <td>{formatTanggalID(e.Join_Date)}</td>
                  </tr>
                ))}
                {!karyawanList.length && (
                  <tr><td colSpan="4" className="empty-cell">Belum ada data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
