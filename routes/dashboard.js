const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const { db } = require('../db/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const batch = db.get('batch').value();
  const kandang = db.get('kandang').value();
  const pakan = db.get('pakan').value();
  const produksi = db.get('produksi').value();
  const keuangan = db.get('keuangan').value();

  const totalPopulasi = batch.reduce((s, b) => s + b.jumlah_aktif, 0);
  const totalMati = batch.reduce((s, b) => s + b.jumlah_mati, 0);
  const totalAfkir = batch.reduce((s, b) => s + b.jumlah_afkir, 0);
  const produktif = batch.filter(b => b.status_produksi === 'produktif').reduce((s, b) => s + b.jumlah_aktif, 0);

  const today = dayjs().format('YYYY-MM-DD');
  const startWeek = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
  const startMonth = dayjs().startOf('month').format('YYYY-MM-DD');
  const startYear = dayjs().startOf('year').format('YYYY-MM-DD');
  const sumButir = (rows) => rows.reduce((s, r) => s + Number(r.jumlah_butir), 0);

  const produksiStats = {
    hariIni: sumButir(produksi.filter(r => r.tanggal === today)),
    mingguIni: sumButir(produksi.filter(r => r.tanggal >= startWeek)),
    bulanIni: sumButir(produksi.filter(r => r.tanggal >= startMonth)),
    tahunIni: sumButir(produksi.filter(r => r.tanggal >= startYear)),
  };
  const rataPerHari = produksi.length ? (produksiStats.bulanIni / dayjs().date()).toFixed(1) : 0;

  const pemasukan = keuangan.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + t.jumlah, 0);
  const pengeluaran = keuangan.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0);

  // Notifikasi otomatis
  const notifikasi = [];
  pakan.forEach(p => {
    if (p.stok <= 10) notifikasi.push({ tipe: 'warning', pesan: `Stok pakan "${p.nama}" menipis: ${p.stok} ${p.satuan}` });
  });
  if (produksiStats.hariIni === 0 && produksi.length > 0) {
    notifikasi.push({ tipe: 'danger', pesan: 'Belum ada produksi telur tercatat hari ini.' });
  }
  batch.forEach(b => {
    if (b.jumlah_mati > 0 && b.jumlah_mati / (b.jumlah_awal || 1) > 0.1) {
      notifikasi.push({ tipe: 'danger', pesan: `Tingkat kematian batch ${b.kode_batch} di atas 10%` });
    }
  });

  // grafik produksi 7 hari terakhir
  const grafikHari = [];
  const grafikJumlah = [];
  for (let i = 6; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    grafikHari.push(dayjs(d).format('DD/MM'));
    grafikJumlah.push(sumButir(produksi.filter(r => r.tanggal === d)));
  }

  res.render('dashboard', {
    title: 'Dashboard',
    totalPopulasi, totalMati, totalAfkir, produktif,
    jumlahKandang: kandang.length,
    produksiStats, rataPerHari,
    pemasukan, pengeluaran, laba: pemasukan - pengeluaran,
    notifikasi,
    grafikHari: JSON.stringify(grafikHari),
    grafikJumlah: JSON.stringify(grafikJumlah)
  });
});

module.exports = router;
