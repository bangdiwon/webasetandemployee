// ============================================================
// Normalisasi & akses data Aset / Karyawan
// ============================================================
import { parseTanggal, isValidDate } from "./format";

// Kolom yang disimpan (data karyawan 35rb+ baris terlalu besar jika semua kolom disimpan)
export const EMPLOYEE_FIELDS = [
  "Number_Id", "NIK", "Name", "Gender", "Branch", "Departement", "Unit",
  "Division", "Position", "Status", "Upliner_Code", "Join_Date",
  "Resign_Date", "Termination_Date", "Resign_Reason",
];
export const ASSET_FIELDS = [
  "No", "Kode Aset", "Source Aset", "Kategori Aset", "Sub Kategori Aset",
  "Merk", "Spesifikasi", "Serial Number", "Harga Pembelian",
  "Tanggal Pembelian", "Cabang", "Lokasi", "Unit", "Username",
  "NIK Serah Terima", "Kondisi Aset", "Catatan Pembelian", "Note Kondisi Aset",
];

const pick = (row, fields) => {
  const out = {};
  fields.forEach((f) => {
    const v = row[f];
    out[f] = typeof v === "string" ? v.trim() : (v ?? "");
  });
  return out;
};

export const normalizeEmployee = (row) => {
  const e = pick(row, EMPLOYEE_FIELDS);
  const g = e.Gender.toLowerCase();
  e.Gender = g.startsWith("l") ? "Laki-laki" : g.startsWith("p") ? "Perempuan" : "";
  return e;
};

export const normalizeAsset = (row) => {
  const a = pick(row, ASSET_FIELDS);
  a["Kategori Aset"] = a["Kategori Aset"] || "Lainnya";
  return a;
};

/** Deteksi jenis file CSV dari header kolom. */
export const detectCsvType = (sample = {}) => {
  if ("Kode Aset" in sample) return "aset";
  if ("NIK" in sample && ("Name" in sample || "Upliner_Code" in sample)) return "karyawan";
  return null;
};

// ------------------------------------------------------------
// Indeks pencarian (Map) supaya lookup NIK/Kode cepat
// ------------------------------------------------------------
export const buildEmployeeIndex = (employees) => {
  const map = new Map();
  employees.forEach((e) => {
    const key = (e.NIK || "").toLowerCase();
    if (key && !map.has(key)) map.set(key, e);
  });
  return map;
};

export const buildAssetIndex = (assets) => {
  const map = new Map();
  assets.forEach((a) => {
    const key = (a["Kode Aset"] || "").toLowerCase();
    if (key && !map.has(key)) map.set(key, a);
  });
  return map;
};

/** Ambil data upliner dari NIK upliner milik karyawan. */
export const getUpliner = (employee, employeeIndex) => {
  const nikUpliner = (employee?.Upliner_Code || "").trim();
  if (!nikUpliner || nikUpliner === "-") return null;
  return (
    employeeIndex.get(nikUpliner.toLowerCase()) || {
      NIK: nikUpliner,
      Name: "",
      notFound: true,
    }
  );
};

/** Teks nama upliner: "NAMA (NIK)" atau "-" */
export const namaUpliner = (employee, employeeIndex) => {
  const up = getUpliner(employee, employeeIndex);
  if (!up) return "-";
  return up.Name || `${up.NIK} (tidak ditemukan)`;
};

export const getNama = (emp) => emp?.Name || emp?.Nama || "-";

/** Tanggal keluar karyawan (resign / terminate), kosong jika masih aktif. */
export const getTanggalKeluar = (emp) => {
  const raw = emp?.Resign_Date || emp?.Termination_Date || "";
  const d = parseTanggal(raw);
  return isValidDate(d) && d.getFullYear() > 1950 ? raw : "";
};

/** Merk + spesifikasi tanpa pengulangan ("HP" + "HP 14S" -> "HP 14S"). */
export const gabungMerkSpek = (aset) => {
  const merk = (aset?.["Merk"] || "").trim();
  const spek = (aset?.["Spesifikasi"] || "").trim();
  if (!merk) return spek || "-";
  if (!spek) return merk;
  return spek.toLowerCase().includes(merk.toLowerCase()) ? spek : `${merk} ${spek}`;
};

/** Departemen karyawan (kolom Departement, bukan Unit). */
export const getDepartemen = (emp) => emp?.Departement || "-";

// ------------------------------------------------------------
// Urutan "terbaru"
// ------------------------------------------------------------
const tsOrZero = (raw) => {
  const d = parseTanggal(raw);
  return isValidDate(d) && d.getFullYear() > 1950 ? d.getTime() : 0;
};

export const asetTerbaru = (assets, limit = 10) =>
  [...assets]
    .sort(
      (a, b) =>
        tsOrZero(b["Tanggal Pembelian"]) - tsOrZero(a["Tanggal Pembelian"]) ||
        (parseInt(b.No, 10) || 0) - (parseInt(a.No, 10) || 0),
    )
    .slice(0, limit);

export const karyawanTerbaru = (employees, limit = 10) =>
  [...employees]
    .sort(
      (a, b) =>
        tsOrZero(b.Join_Date) - tsOrZero(a.Join_Date) ||
        (parseInt(b.Number_Id, 10) || 0) - (parseInt(a.Number_Id, 10) || 0),
    )
    .slice(0, limit);

// ------------------------------------------------------------
// Agregasi untuk grafik
// ------------------------------------------------------------
export const groupCount = (list, keyFn) => {
  const acc = {};
  list.forEach((item) => {
    const k = keyFn(item) || "Lainnya";
    acc[k] = (acc[k] || 0) + 1;
  });
  return Object.entries(acc)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};
