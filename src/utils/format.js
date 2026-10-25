// ============================================================
// Helper format angka, tanggal, dan perhitungan nilai aset
// ============================================================

/**
 * Mengubah teks angka (format Indonesia / internasional) menjadi number.
 * Contoh: "9.548.649" -> 9548649 | "2,250,980" -> 2250980 | "1.250,50" -> 1250.5
 */
export const parseAngka = (val) => {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;

  let str = String(val).trim().replace(/[^0-9.,-]/g, "");
  if (!str || str === "-") return 0;

  const dots = (str.match(/\./g) || []).length;
  const commas = (str.match(/,/g) || []).length;

  if (dots && commas) {
    // Pemisah desimal = tanda yang muncul paling akhir
    str =
      str.lastIndexOf(".") > str.lastIndexOf(",")
        ? str.replace(/,/g, "")
        : str.replace(/\./g, "").replace(",", ".");
  } else if (dots > 1 || commas > 1) {
    // "9.548.649" / "2,250,980" -> pemisah ribuan
    str = str.replace(/[.,]/g, "");
  } else if (dots === 1 || commas === 1) {
    const sep = dots ? "." : ",";
    const [, tail = ""] = str.split(sep);
    // 3 digit di belakang pemisah => ribuan ("510.000"), selain itu desimal
    str = tail.length === 3 ? str.replace(sep, "") : str.replace(sep, ".");
  }
  return parseFloat(str) || 0;
};

export const formatRupiah = (angka) =>
  "Rp " + Math.round(parseAngka(angka)).toLocaleString("id-ID");

/** Angka dengan pemisah ribuan tanpa "Rp". Contoh: 9548649 -> "9.548.649" */
export const formatAngka = (angka) =>
  Math.round(parseAngka(angka)).toLocaleString("id-ID");

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const ROMAN_MONTHS = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
];
export const romanMonth = (date = new Date()) => ROMAN_MONTHS[date.getMonth()];

/** Parse tanggal dari: serial Excel, dd/mm/yyyy, yyyy-mm-dd, atau Date. */
export const parseTanggal = (raw) => {
  if (raw instanceof Date) return raw;
  if (raw === null || raw === undefined) return new Date(NaN);
  const str = String(raw).trim();
  if (!str || str === "-") return new Date(NaN);

  if (/^\d+(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str);
    // serial Excel (kira-kira tahun 1955 - 2064)
    if (serial > 20000 && serial < 60000) {
      return new Date(new Date(1899, 11, 30).getTime() + serial * 86400000);
    }
    return new Date(NaN);
  }

  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map((p) => parseInt(p, 10));
    if (parts[2].length === 4) return new Date(c, b - 1, a); // dd/mm/yyyy
    if (parts[0].length === 4) return new Date(a, b - 1, c); // yyyy-mm-dd
  }
  return new Date(NaN);
};

export const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

export const formatTanggalID = (raw) => {
  if (!raw || raw === "-") return "-";
  const d = parseTanggal(raw);
  if (!isValidDate(d) || d.getFullYear() < 1950) return "-";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
};

// ------------------------------------------------------------
// Penyusutan garis lurus 48 bulan
// ------------------------------------------------------------
export const MASA_SUSUT_BULAN = 48;
export const PERSEN_HARGA_PASAR = 0.7;

/**
 * Menghitung nilai buku (setelah penyusutan) & estimasi harga pasar.
 * - Tanggal beli kosong/tidak valid -> belum disusutkan (nilai buku = harga beli)
 * - Lewat 48 bulan -> nilai buku Rp 0
 */
export const hitungNilaiAset = (
  rawHarga,
  rawTglBeli,
  persenPasar = PERSEN_HARGA_PASAR,
) => {
  const harga = parseAngka(rawHarga);
  if (harga <= 0) return { hargaBeli: 0, nilaiBuku: 0, nilaiPasar: 0 };

  const tglBeli = parseTanggal(rawTglBeli);
  let nilaiBuku = harga;

  if (isValidDate(tglBeli)) {
    const now = new Date();
    const bulan = Math.max(
      0,
      (now.getFullYear() - tglBeli.getFullYear()) * 12 +
        (now.getMonth() - tglBeli.getMonth()),
    );
    nilaiBuku =
      bulan >= MASA_SUSUT_BULAN
        ? 0
        : Math.max(0, harga - (harga / MASA_SUSUT_BULAN) * bulan);
  }

  return {
    hargaBeli: Math.round(harga),
    nilaiBuku: Math.round(nilaiBuku),
    // Estimasi harga pasar = 70% dari nilai buku (sama dengan logika awal)
    nilaiPasar: Math.round(nilaiBuku * persenPasar),
  };
};

/** "Kamis, 22 Oktober 2026" */
export const formatHariTanggal = (date = new Date()) =>
  `${DAYS_ID[date.getDay()]}, ${formatTanggalID(date)}`;

/**
 * Nomor dokumen berjalan.
 *  - { pad: 5 }                          -> 00001/X/2026
 *  - { pad: 5, akhiran: "FSTA" }         -> 00107/X/FSTA/2026
 *  - { pad: 3, prefix: "FRM/DIKA/" }     -> 008/FRM/DIKA/X/2026
 */
export const buatNomorDokumen = (no, { pad = 5, prefix = "", akhiran = "" } = {}) => {
  if (!/^\d+$/.test(String(no))) return no;
  const now = new Date();
  const tengah = `${prefix}${romanMonth(now)}${akhiran ? `/${akhiran}` : ""}`;
  return `${String(no).padStart(pad, "0")}/${tengah}/${now.getFullYear()}`;
};
