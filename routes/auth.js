const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { db } = require('../db/db');

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { layout: false, error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.get('users').find({ username }).value();
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('login', { layout: false, error: 'Username atau password salah.' });
  }
  req.session.user = { id: user.id, nama: user.nama, username: user.username, role: user.role };
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
