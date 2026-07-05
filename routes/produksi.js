const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const { db, nextId } = require('../db/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const produksi = db.get('produksi').value().slice().reverse();
  const batch = db.get('batch').value();

  const today = dayjs().format('YYYY-MM-DD');
  const startWeek = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
  const startMonth = dayjs().startOf('month').format('YYYY-MM-DD');
  const startYear = dayjs().startOf('year').format('YYYY-MM-DD');

  const sumButir = (rows) => rows.reduce((s, r) => s + Number(r.jumlah_butir), 0);
  const all = db.get('produksi').value();

  const stats = {
    hariIni: sumButir(all.filter(r => r.tanggal === today)),
    mingguIni: sumButir(all.filter(r => r.tanggal >= startWeek)),
    bulanIni: sumButir(all.filter(r => r.tanggal >= startMonth)),
    tahunIni: sumButir(all.filter(r => r.tanggal >= startYear)),
  };

  res.render('produksi/index', { title: 'Manajemen Produksi Telur', produksi, batch, stats });
});

router.get('/tambah', (req, res) => {
  const batch = db.get('batch').value();
  res.render('produksi/form', { title: 'Catat Produksi Telur', batch });
});

router.post('/', (req, res) => {
  const { batch_id, tanggal, jumlah_butir, berat_kg, grade_a, grade_b, grade_c, retak, rusak } = req.body;
  db.get('produksi').push({
    id: nextId('produksi'),
    batch_id: Number(batch_id),
    tanggal,
    jumlah_butir: Number(jumlah_butir),
    berat_kg: Number(berat_kg) || 0,
    grade_a: Number(grade_a) || 0,
    grade_b: Number(grade_b) || 0,
    grade_c: Number(grade_c) || 0,
    retak: Number(retak) || 0,
    rusak: Number(rusak) || 0,
    terjual: 0,
    created_at: new Date().toISOString()
  }).write();
  res.redirect('/produksi');
});

router.delete('/:id', (req, res) => {
  db.get('produksi').remove({ id: Number(req.params.id) }).write();
  res.redirect('/produksi');
});

module.exports = router;
