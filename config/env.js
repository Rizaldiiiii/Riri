'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Muat berkas .env yang berada di root proyek, apa pun direktori kerja saat dijalankan.
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function angka(nilai, bawaan) {
  const hasil = Number.parseInt(nilai, 10);
  return Number.isFinite(hasil) && hasil > 0 ? hasil : bawaan;
}

const SITE_URL = String(process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

module.exports = {
  PORT: angka(process.env.PORT, 3000),
  SITE_URL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  WHATSAPP_NOMOR: String(process.env.WHATSAPP_NOMOR || '').replace(/\D/g, '')
};
