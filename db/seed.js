const bcrypt = require('bcryptjs');
const { db, nextId } = require('./db');

function seedUser(nama, username, password, role) {
  if (db.get('users').find({ username }).value()) return;
  db.get('users').push({
    id: nextId('user'),
    nama,
    username,
    password: bcrypt.hashSync(password, 8),
    role, // owner, manajer, petugas_kandang, keuangan, gudang, dokter_hewan
    created_at: new Date().toISOString()
  }).write();
}

seedUser('Berlian', 'admin', 'admin123', 'admin');

// Seed satu kandang contoh untuk Kandang Elba (6 ekor)
if (db.get('kandang').value().length === 0) {
  const kId = nextId('kandang');
  db.get('kandang').push({
    id: kId,
    nama: 'Kandang Elba 1',
    kapasitas: 20,
    lokasi: 'Rumah - Sidoarjo',
    kondisi: 'Baik',
    created_at: new Date().toISOString()
  }).write();

  db.get('batch').push({
    id: nextId('batch'),
    kode_batch: 'ELBA-001',
    ras: 'Elba',
    jumlah_awal: 6,
    jumlah_aktif: 6,
    jumlah_mati: 0,
    jumlah_afkir: 0,
    tanggal_masuk: new Date().toISOString().slice(0,10),
    asal_supplier: 'Ternak Keluarga',
    kandang_id: kId,
    status_produksi: 'produktif',
    catatan: 'Batch awal 6 ekor ayam ras Elba',
    created_at: new Date().toISOString()
  }).write();
}

console.log('Seed selesai. Akun default:');
console.log('admin / admin123');
