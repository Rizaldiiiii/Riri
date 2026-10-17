'use strict';

const path = require('path');
const express = require('express');
const env = require('./config/env');
require('./data/storage'); // inisialisasi lapisan penyimpanan saat aplikasi dimulai

const apiRouter = require('./routes/api');
const adminRouter = require('./routes/admin');
const qrRouter = require('./routes/qr');

const app = express();
const PORT = env.PORT;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

// Pengaman dasar untuk semua respons.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// API
app.use('/api/admin', adminRouter);
app.use('/api', qrRouter);
app.use('/api', apiRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));

// Halaman statis (public/index.html, public/produk.html, dst.)
app.use(express.static(PUBLIC_DIR, { extensions: ['html'], index: 'index.html' }));

// Penanganan galat
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
  }
  res.status(404).type('html').send(
    '<!doctype html><html lang="id"><head><meta charset="utf-8">' +
      '<title>Halaman tidak ditemukan — BanaFitBrow</title>' +
      '<meta name="viewport" content="width=device-width, initial-scale=1"></head>' +
      '<body style="font-family:system-ui,sans-serif;padding:2rem;line-height:1.6">' +
      '<h1>404 — Halaman tidak ditemukan</h1>' +
      '<p>Halaman yang Anda tuju tidak tersedia.</p>' +
      '<p><a href="/">Kembali ke beranda</a></p></body></html>'
  );
});

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Format data tidak valid.' });
  }
  console.error('[server] Galat tidak terduga:', err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

app.listen(PORT, () => {
  console.log('BanaFitBrow berjalan di http://localhost:' + PORT);
  console.log('QR Code menuju: ' + env.SITE_URL);
  console.log('Dashboard admin: http://localhost:' + PORT + '/admin');
});
