const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const { db, nextId } = require('../db/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const semua = db.get('keuangan').value().slice().reverse();
  const pemasukan = semua.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + t.jumlah, 0);
  const pengeluaran = semua.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0);
  const saldo = pemasukan - pengeluaran;

  const startMonth = dayjs().startOf('month').format('YYYY-MM-DD');
  const bulanIni = semua.filter(t => t.tanggal >= startMonth);
  const pemasukanBulan = bulanIni.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + t.jumlah, 0);
  const pengeluaranBulan = bulanIni.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0);

  res.render('keuangan/index', {
    title: 'Manajemen Keuangan',
    transaksi: semua,
    pemasukan, pengeluaran, saldo,
    pemasukanBulan, pengeluaranBulan,
    labaBulan: pemasukanBulan - pengeluaranBulan
  });
});

router.get('/tambah', (req, res) => {
  res.render('keuangan/form', { title: 'Tambah Transaksi Keuangan' });
});

router.post('/', (req, res) => {
  const { jenis, kategori, deskripsi, jumlah, tanggal } = req.body;
  db.get('keuangan').push({
    id: nextId('keuangan'),
    jenis, kategori, deskripsi,
    jumlah: Number(jumlah),
    tanggal: tanggal || new Date().toISOString().slice(0,10),
    created_at: new Date().toISOString()
  }).write();
  res.redirect('/keuangan');
});

router.delete('/:id', (req, res) => {
  db.get('keuangan').remove({ id: Number(req.params.id) }).write();
  res.redirect('/keuangan');
});

module.exports = router;
