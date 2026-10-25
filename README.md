# Project Dimas (Web Aset – DIKA)

Aplikasi manajemen aset & karyawan (React / CRA). Data diimpor dari CSV (`;`) lewat tombol **Import CSV**
(`db/db_aset.csv`, `db/db_employee.csv`). Data hanya disimpan di memori selama halaman terbuka — tidak ada penyimpanan di browser, jadi upload CSV lagi setiap membuka/refresh aplikasi.

## Menjalankan
```
npm install      # wajib diulang: ada dependency baru "docx"
npm start
```

## Struktur
```
public/logo.png                 Logo dokumen (dipakai di semua kop form)
src/
  App.js                        Shell: login, sidebar, routing tab
  hooks/useDatabase.js          Data aset/karyawan (memori), indeks NIK/Kode, import CSV
  hooks/useLogo.js              Memuat public/logo.png (aman untuk Print/PDF/Word)
  utils/format.js               Angka, Rupiah, tanggal, penyusutan 48 bulan, nomor dokumen
  utils/data.js                 Normalisasi CSV, upliner (via Upliner_Code), data terbaru, agregasi grafik
  utils/export.js               Export PDF (html2pdf)
  utils/exportWord.js           Export Word .docx asli (library "docx"), dibaca dari tampilan form
  components/Dashboard.jsx      Statistik, grafik kategori aset & gender, tabel 10 terbaru
  components/CariData.jsx       Pencarian aset / karyawan (+ nama upliner)
  components/forms/
    FormParts.jsx               Kop dokumen, tanda tangan, toolbar export, field (dipakai semua form)
    FormAsetSOP.jsx             Logika Form OP & TELE (variant "op" | "tele")
    FormOP.jsx / FormTele.jsx   Wrapper tipis
    FormBulky.jsx               Multi aset (landscape)
    FormTandaTerima.jsx         A5
    KetentuanAset.jsx           Halaman 2 (ketentuan kehilangan & kerusakan)
```

## Menambah form baru
1. Buat komponen di `components/forms/` memakai `FormControls`, `PreviewWrapper`, `DocHeader`, `SignatureTable`.
2. Tambah satu item di `MENU` (`Sidebar.jsx`) dan satu baris di `pages` (`App.js`).

## Aturan bisnis
- **Upliner**: `Upliner_Code` di data karyawan = NIK upliner → nama diambil dari karyawan ber-NIK tersebut.
- **Harga Buku**: penyusutan garis lurus 48 bulan dari `Harga Pembelian` & `Tanggal Pembelian`
  (tanggal kosong = belum disusutkan). **Harga Pasar** = 70% × Harga Buku.
- **Form OP/TELE**: judul selalu *FORM SERAH TERIMA ASET*; departemen penyerah selalu *Aset*.
- **Form Bulky**: kolom harga = `Harga Pembelian`.
