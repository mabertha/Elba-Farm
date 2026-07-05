const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const { db, nextId } = require('../db/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

function withUmur(b) {
  const hariSejakMasuk = dayjs().diff(dayjs(b.tanggal_masuk), 'day');
  const umurAwalHari = b.umur_awal_hari || 0;
  const totalHari = umurAwalHari + hariSejakMasuk;
  const minggu = Math.floor(totalHari / 7);
  const bulan = Math.floor(totalHari / 30);
  const kandang = db.get('kandang').find({ id: b.kandang_id }).value();
  return { ...b, umur_hari: totalHari, umur_minggu: minggu, umur_bulan: bulan, hari_sejak_masuk: hariSejakMasuk, kandang_nama: kandang ? kandang.nama : '-' };
}

router.get('/', (req, res) => {
  const batch = db.get('batch').value().map(withUmur);
  res.render('ayam/index', { title: 'Manajemen Ayam / Batch', batch });
});

router.get('/tambah', (req, res) => {
  const kandang = db.get('kandang').value();
  res.render('ayam/form', { title: 'Tambah Batch Ayam', batch: null, kandang });
});

router.post('/', (req, res) => {
  const { kode_batch, ras, jumlah_awal, tanggal_masuk, asal_supplier, kandang_id, catatan, umur_awal_nilai, umur_awal_satuan } = req.body;
  const nilai = Number(umur_awal_nilai) || 0;
  const umurAwalHari = umur_awal_satuan === 'bulan' ? nilai * 30 : nilai * 7;
  db.get('batch').push({
    id: nextId('batch'),
    kode_batch, ras,
    jumlah_awal: Number(jumlah_awal),
    jumlah_aktif: Number(jumlah_awal),
    jumlah_mati: 0,
    jumlah_afkir: 0,
    tanggal_masuk,
    umur_awal_hari: umurAwalHari,
    asal_supplier,
    kandang_id: Number(kandang_id),
    status_produksi: 'produktif',
    catatan,
    created_at: new Date().toISOString()
  }).write();
  res.redirect('/ayam');
});

router.get('/:id', (req, res) => {
  const b = db.get('batch').find({ id: Number(req.params.id) }).value();
  if (!b) return res.redirect('/ayam');
  const batch = withUmur(b);
  const kesehatan = db.get('kesehatan').filter({ batch_id: b.id }).value().slice().reverse();
  const produksi = db.get('produksi').filter({ batch_id: b.id }).value().slice().reverse();
  const totalTelur = produksi.reduce((s, p) => s + p.jumlah_butir, 0);
  const rataTelurPerHari = produksi.length ? (totalTelur / produksi.length).toFixed(1) : 0;
  res.render('ayam/detail', { title: `Detail Batch ${b.kode_batch}`, batch, kesehatan, produksi, totalTelur, rataTelurPerHari });
});

router.get('/:id/edit', (req, res) => {
  const batchRaw = db.get('batch').find({ id: Number(req.params.id) }).value();
  const kandang = db.get('kandang').value();
  if (!batchRaw) return res.redirect('/ayam');
  const batch = { ...batchRaw, umur_awal_nilai_prefill: Math.round((batchRaw.umur_awal_hari || 0) / 7) };
  res.render('ayam/form', { title: 'Edit Batch Ayam', batch, kandang });
});

router.put('/:id', (req, res) => {
  const { kode_batch, ras, tanggal_masuk, asal_supplier, kandang_id, status_produksi, catatan, umur_awal_nilai, umur_awal_satuan } = req.body;
  const nilai = Number(umur_awal_nilai) || 0;
  const umurAwalHari = umur_awal_satuan === 'bulan' ? nilai * 30 : nilai * 7;
  db.get('batch').find({ id: Number(req.params.id) })
    .assign({ kode_batch, ras, tanggal_masuk, umur_awal_hari: umurAwalHari, asal_supplier, kandang_id: Number(kandang_id), status_produksi, catatan })
    .write();
  res.redirect('/ayam');
});

// Catat kematian / afkir - otomatis update populasi
router.post('/:id/kurangi', (req, res) => {
  const { jenis, jumlah, catatan } = req.body; // jenis: mati | afkir
  const b = db.get('batch').find({ id: Number(req.params.id) }).value();
  if (b) {
    const jml = Math.min(Number(jumlah), b.jumlah_aktif);
    const update = { jumlah_aktif: b.jumlah_aktif - jml };
    if (jenis === 'mati') update.jumlah_mati = b.jumlah_mati + jml;
    else update.jumlah_afkir = b.jumlah_afkir + jml;
    db.get('batch').find({ id: b.id }).assign(update).write();

    db.get('kesehatan').push({
      id: Date.now(),
      batch_id: b.id,
      jenis: jenis === 'mati' ? 'Kematian' : 'Afkir',
      jumlah: jml,
      catatan,
      tanggal: new Date().toISOString().slice(0,10)
    }).write();
  }
  res.redirect('/ayam');
});

router.delete('/:id', (req, res) => {
  db.get('batch').remove({ id: Number(req.params.id) }).write();
  res.redirect('/ayam');
});

module.exports = router;
