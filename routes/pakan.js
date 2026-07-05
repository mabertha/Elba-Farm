const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

const BATAS_MINIMUM = 10; // kg, ambang peringatan stok menipis

router.get('/', (req, res) => {
  const pakan = db.get('pakan').value();
  const log = db.get('pakan_log').value().slice(-20).reverse();
  res.render('pakan/index', { title: 'Manajemen Pakan', pakan, log, batasMinimum: BATAS_MINIMUM });
});

router.get('/tambah', (req, res) => {
  res.render('pakan/form', { title: 'Tambah Jenis Pakan', pakan: null });
});

router.post('/', (req, res) => {
  const { nama, supplier, stok, satuan, harga_per_satuan } = req.body;
  db.get('pakan').push({
    id: nextId('pakan'),
    nama, supplier,
    stok: Number(stok),
    satuan: satuan || 'kg',
    harga_per_satuan: Number(harga_per_satuan) || 0,
    created_at: new Date().toISOString()
  }).write();
  res.redirect('/pakan');
});

// Pemakaian pakan harian - otomatis kurangi stok & catat biaya ke keuangan (opsional dicatat sbg pengeluaran saat pembelian, bukan saat pakai)
router.post('/pakai', (req, res) => {
  const { pakan_id, jumlah, kandang_id, catatan } = req.body;
  const p = db.get('pakan').find({ id: Number(pakan_id) }).value();
  if (p) {
    const jml = Number(jumlah);
    db.get('pakan').find({ id: p.id }).assign({ stok: Math.max(0, p.stok - jml) }).write();
    db.get('pakan_log').push({
      id: nextId('pakan_log'),
      pakan_id: p.id,
      pakan_nama: p.nama,
      jumlah: jml,
      kandang_id: Number(kandang_id) || null,
      catatan,
      tanggal: new Date().toISOString().slice(0,10)
    }).write();
  }
  res.redirect('/pakan');
});

// Stok masuk (pembelian) - otomatis tambah stok & catat pengeluaran keuangan
router.post('/masuk', (req, res) => {
  const { pakan_id, jumlah, total_biaya } = req.body;
  const p = db.get('pakan').find({ id: Number(pakan_id) }).value();
  if (p) {
    const jml = Number(jumlah);
    db.get('pakan').find({ id: p.id }).assign({ stok: p.stok + jml }).write();
    if (Number(total_biaya) > 0) {
      db.get('keuangan').push({
        id: nextId('keuangan'),
        jenis: 'pengeluaran',
        kategori: 'Pembelian Pakan',
        deskripsi: `Pembelian ${jml} ${p.satuan} ${p.nama}`,
        jumlah: Number(total_biaya),
        tanggal: new Date().toISOString().slice(0,10),
        created_at: new Date().toISOString()
      }).write();
    }
  }
  res.redirect('/pakan');
});

router.delete('/:id', (req, res) => {
  db.get('pakan').remove({ id: Number(req.params.id) }).write();
  res.redirect('/pakan');
});

module.exports = router;
