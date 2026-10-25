import { useState, useMemo, useCallback } from "react";
import Papa from "papaparse";
import {
  normalizeAsset,
  normalizeEmployee,
  detectCsvType,
  buildAssetIndex,
  buildEmployeeIndex,
} from "../utils/data";

/**
 * Sumber data tunggal aplikasi: data aset & karyawan, indeks pencarian,
 * serta proses import CSV (delimiter ";"). Data tidak disimpan di browser.
 */
export default function useDatabase() {
  // Data hanya disimpan di memori (state). Tidak ada penyimpanan di browser:
  // setiap membuka aplikasi, data dimuat ulang lewat tombol Import CSV.
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);

  const assetIndex = useMemo(() => buildAssetIndex(assets), [assets]);
  const employeeIndex = useMemo(() => buildEmployeeIndex(employees), [employees]);

  const getAset = useCallback(
    (kode) => assetIndex.get((kode || "").trim().toLowerCase()) || null,
    [assetIndex],
  );
  const getKaryawan = useCallback(
    (nik) => employeeIndex.get((nik || "").trim().toLowerCase()) || null,
    [employeeIndex],
  );

  const importFiles = useCallback((fileList) => {
    Array.from(fileList).forEach((file) => {
      Papa.parse(file, {
        header: true,
        delimiter: ";",
        skipEmptyLines: true,
        complete: ({ data }) => {
          const type = detectCsvType(data[0]);
          if (type === "aset") {
            setAssets(data.map(normalizeAsset));
            alert(`Berhasil memuat ${data.length.toLocaleString("id-ID")} data Aset`);
          } else if (type === "karyawan") {
            setEmployees(data.map(normalizeEmployee));
            alert(`Berhasil memuat ${data.length.toLocaleString("id-ID")} data Karyawan`);
          } else {
            alert(`File "${file.name}" tidak dikenali (bukan data Aset / Karyawan).`);
          }
        },
      });
    });
  }, []);

  return { assets, employees, getAset, getKaryawan, employeeIndex, importFiles };
}
