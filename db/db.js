const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'data.json'));
const db = low(adapter);

// Default structure
db.defaults({
  users: [],
  kandang: [],
  batch: [],       // kelompok ayam
  pakan: [],
  pakan_log: [],   // penggunaan pakan harian
  produksi: [],    // produksi telur harian
  penjualan: [],
  keuangan: [],    // transaksi keuangan umum (pemasukan/pengeluaran)
  kesehatan: [],   // log kesehatan/vaksin/obat
  counters: { user: 0, kandang: 0, batch: 0, pakan: 0, pakan_log: 0, produksi: 0, penjualan: 0, keuangan: 0, kesehatan: 0 }
}).write();

function nextId(entity) {
  const val = db.get(`counters.${entity}`).value() + 1;
  db.set(`counters.${entity}`, val).write();
  return val;
}

module.exports = { db, nextId };
