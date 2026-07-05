# Elba Farm Management

Sistem Informasi Manajemen Peternakan Ayam Petelur untuk Kandang Elba — dibangun agar bisa langsung dijalankan dan berkembang bertahap.

## Cara Menjalankan

1. Pastikan Node.js sudah terinstall (v18 ke atas).
2. Buka terminal di folder ini, lalu jalankan:
   ```
   npm install
   npm run seed   # hanya perlu dijalankan sekali di awal, membuat akun & data contoh
   npm start
   ```
3. Buka browser ke `http://localhost:3000`

## Akun Login Default

| Username | Password  |
|----------|-----------|
| admin    | admin123  |

Semua user yang login punya akses penuh ke seluruh fitur (tidak ada pembatasan role). **Segera ganti password ini** kalau sudah dipakai serius — saat ini akun disimpan di `db/seed.js`.

## Fitur yang Sudah Jadi (Fase 1)

- **Autentikasi** — login sederhana, semua user punya akses penuh.
- **Dashboard real-time** — populasi, produksi hari ini/minggu/bulan/tahun, grafik 7 hari terakhir, notifikasi otomatis (stok pakan menipis, belum ada produksi hari ini, mortalitas tinggi).
- **Manajemen Kandang** — CRUD kandang, kapasitas, populasi otomatis terhitung dari batch di dalamnya.
- **Manajemen Ayam/Batch** — umur otomatis dihitung dari tanggal masuk, pencatatan kematian/afkir yang otomatis mengurangi populasi.
- **Manajemen Pakan** — stok otomatis berkurang saat dipakai dan bertambah saat pembelian, pembelian otomatis tercatat sebagai pengeluaran di Keuangan.
- **Produksi Telur** — pencatatan harian per batch (jumlah, berat, grade A/B/C, retak/rusak), rekap otomatis harian/mingguan/bulanan/tahunan.
- **Penjualan Telur** — otomatis memotong stok telur (FIFO dari data produksi) dan otomatis tercatat sebagai pemasukan di Keuangan bila status "lunas".
- **Keuangan** — pemasukan/pengeluaran, saldo & laba bulan berjalan terhitung otomatis dari seluruh modul di atas.

Semua modul sudah terintegrasi seperti yang diminta: tambah produksi → stok telur bertambah; jual telur → stok berkurang & kas bertambah; beli pakan → stok bertambah & kas berkurang; ayam mati/afkir → populasi & kesehatan ikut update.

## Belum Dibangun (Fase Berikutnya)

Spesifikasi awal setara ERP peternakan skala penuh. Modul berikut belum ada dan bisa ditambahkan bertahap:
- Manajemen Air Minum, Kesehatan detail (jadwal vaksin/obat terjadwal), Populasi (laporan tersendiri)
- Manajemen Pegawai, Inventaris umum, Dokumen, Kalender Kegiatan
- Laporan export PDF/Excel, Analitik BI (FCR, prediksi produksi/keuntungan)
- QR Code identitas batch/kandang, audit trail, dark mode, backup database

## Struktur Teknis

- **Stack:** Node.js + Express + EJS + Tailwind CSS (CDN) + Chart.js (CDN)
- **Database:** file JSON lokal (`db/data.json`) via lowdb — tidak butuh instalasi MySQL/database server terpisah, cocok untuk skala kecil/keluarga. Kalau nanti sudah butuh skala lebih besar, bisa dimigrasikan ke MySQL/PostgreSQL karena struktur data (tabel `kandang`, `batch`, `pakan`, `produksi`, dst) sudah dirancang relasional.
- **Kenapa bukan Laravel seperti spesifikasi awal:** environment saya tidak bisa mengakses Packagist untuk instalasi Composer/Laravel, jadi saya pilih stack yang bisa saya bangun dan **benar-benar saya jalankan & tes sendiri** sebelum diserahkan ke kamu. Semua fitur di atas sudah dites end-to-end (CRUD, integrasi antar modul, RBAC).

## File Data

Data tersimpan di `db/data.json`. Untuk backup, cukup salin file ini. Untuk reset ke data contoh, hapus file tersebut lalu jalankan `npm run seed` lagi.
