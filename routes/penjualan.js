const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

function stokTelurTersedia() {
  const p = db.get('produksi').value();
  const totalProduksi = p.reduce((s, r) => s + r.jumlah_butir, 0);
  const totalTerjual = p.reduce((s, r) => s + (r.terjual || 0), 0);
  return totalProduksi - totalTerjual;
}

router.get('/', (req, res) => {
  const penjualan = db.get('penjualan').value().slice().reverse();
  res.render('penjualan/index', { title: 'Penjualan Telur', penjualan, stokTersedia: stokTelurTersedia() });
});

router.get('/tambah', (req, res) => {
  res.render('penjualan/form', { title: 'Tambah Penjualan Telur', stokTersedia: stokTelurTersedia() });
});

router.post('/', (req, res) => {
  const { pelanggan, jumlah_butir, harga_per_butir, metode_pembayaran, status_pembayaran, tanggal } = req.body;
  const jml = Number(jumlah_butir);
  const total = jml * Number(harga_per_butir);

  // kurangi stok telur dari batch produksi terlama dulu (FIFO)
  let sisa = jml;
  const produksiList = db.get('produksi').filter(r => (r.jumlah_butir - (r.terjual || 0)) > 0).value();
  for (const p of produksiList) {
    if (sisa <= 0) break;
    const tersedia = p.jumlah_butir - (p.terjual || 0);
    const ambil = Math.min(tersedia, sisa);
    db.get('produksi').find({ id: p.id }).assign({ terjual: (p.terjual || 0) + ambil }).write();
    sisa -= ambil;
  }

  db.get('penjualan').push({
    id: nextId('penjualan'),
    pelanggan, jumlah_butir: jml,
    harga_per_butir: Number(harga_per_butir),
    total,
    metode_pembayaran, status_pembayaran,
    tanggal: tanggal || new Date().toISOString().slice(0,10),
    created_at: new Date().toISOString()
  }).write();

  // otomatis catat sebagai pemasukan di keuangan jika sudah dibayar
  if (status_pembayaran === 'lunas') {
    db.get('keuangan').push({
      id: nextId('keuangan'),
      jenis: 'pemasukan',
      kategori: 'Penjualan Telur',
      deskripsi: `Penjualan ${jml} butir ke ${pelanggan}`,
      jumlah: total,
      tanggal: tanggal || new Date().toISOString().slice(0,10),
      created_at: new Date().toISOString()
    }).write();
  }

  res.redirect('/penjualan');
});

module.exports = router;
