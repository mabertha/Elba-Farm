const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

function withPopulasi(k) {
  const batches = db.get('batch').filter({ kandang_id: k.id }).value();
  const populasi = batches.reduce((sum, b) => sum + b.jumlah_aktif, 0);
  return { ...k, populasi, jumlah_batch: batches.length };
}

router.get('/', (req, res) => {
  const kandang = db.get('kandang').value().map(withPopulasi);
  res.render('kandang/index', { title: 'Manajemen Kandang', kandang });
});

router.get('/tambah', (req, res) => {
  res.render('kandang/form', { title: 'Tambah Kandang', kandang: null });
});

router.post('/', (req, res) => {
  const { nama, kapasitas, lokasi, kondisi } = req.body;
  db.get('kandang').push({
    id: nextId('kandang'),
    nama, kapasitas: Number(kapasitas), lokasi, kondisi: kondisi || 'Baik',
    created_at: new Date().toISOString()
  }).write();
  res.redirect('/kandang');
});

router.get('/:id/edit', (req, res) => {
  const kandang = db.get('kandang').find({ id: Number(req.params.id) }).value();
  if (!kandang) return res.redirect('/kandang');
  res.render('kandang/form', { title: 'Edit Kandang', kandang });
});

router.put('/:id', (req, res) => {
  const { nama, kapasitas, lokasi, kondisi } = req.body;
  db.get('kandang').find({ id: Number(req.params.id) })
    .assign({ nama, kapasitas: Number(kapasitas), lokasi, kondisi }).write();
  res.redirect('/kandang');
});

router.delete('/:id', (req, res) => {
  db.get('kandang').remove({ id: Number(req.params.id) }).write();
  res.redirect('/kandang');
});

module.exports = router;
