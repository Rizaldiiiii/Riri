'use strict';

const express = require('express');
const QRCode = require('qrcode');
const env = require('../config/env');

const router = express.Router();

/**
 * GET /api/qr.png?url=&size=
 * Menghasilkan QR Code PNG yang mengarah ke alamat website.
 * Digunakan untuk pratinjau dan pencetakan pada kemasan.
 */
router.get('/qr.png', async (req, res) => {
  const ukuranAsli = Number.parseInt(req.query.size, 10);
  const ukuran = Number.isFinite(ukuranAsli) ? Math.min(Math.max(ukuranAsli, 128), 2048) : 512;

  let tautan = env.SITE_URL;
  if (req.query.url) {
    try {
      const calon = new URL(String(req.query.url));
      if (calon.protocol === 'http:' || calon.protocol === 'https:') tautan = calon.toString();
    } catch (err) {
      return res.status(400).json({ error: 'URL QR Code tidak valid.' });
    }
  }

  try {
    const buffer = await QRCode.toBuffer(tautan, {
      type: 'png',
      width: ukuran,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#3A2317', light: '#FFFFFF' }
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  } catch (err) {
    console.error('[qr] Gagal membuat QR Code:', err);
    res.status(500).json({ error: 'QR Code tidak dapat dibuat.' });
  }
});

module.exports = router;
