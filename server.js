const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'elba-farm-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 jam
}));

// Kirim data user ke semua view
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));
app.use('/kandang', require('./routes/kandang'));
app.use('/ayam', require('./routes/ayam'));
app.use('/pakan', require('./routes/pakan'));
app.use('/produksi', require('./routes/produksi'));
app.use('/penjualan', require('./routes/penjualan'));
app.use('/keuangan', require('./routes/keuangan'));

app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Halaman Tidak Ditemukan', layout: false });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Elba Farm Management berjalan di http://localhost:${PORT}`);
});
