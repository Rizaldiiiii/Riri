'use strict';

const express = require('express');
const storage = require('../data/storage');
const produkData = require('../data/produk');
const env = require('../config/env');
const { validasiPesanan, validasiFeedback } = require('./util');

const router = express.Router();

/**
 * GET /api/produk — konfigurasi produk untuk keperluan rendering halaman.
 * Nomor WhatsApp dari berkas .env (WHATSAPP_NOMOR), bila diisi, menimpa data konfigurasi.
 */
router.get('/produk', (req, res) => {
  const data = Object.assign({}, produkData);

  if (env.WHATSAPP_NOMOR) {
    data.kontak = Object.assign({}, produkData.kontak, {
      whatsapp: Object.assign({}, produkData.kontak.whatsapp, { nomor: env.WHATSAPP_NOMOR })
    });
    data.mediaSosial = produkData.mediaSosial.map((media) =>
      media.nama === 'WhatsApp'
        ? Object.assign({}, media, { tautan: 'https://wa.me/' + env.WHATSAPP_NOMOR })
        : media
    );
  }

  res.json(data);
});

/** POST /api/pesanan — menyimpan pesanan konsumen. */
router.post('/pesanan', (req, res) => {
  const hasil = validasiPesanan(req.body, produkData.varian);
  if (!hasil.ok) {
    return res.status(400).json({ error: hasil.error });
  }

  try {
    const rekaman = storage.tambahPesanan(hasil.data);
    return res.status(201).json({
      ok: true,
      pesan: 'Pesanan berhasil disimpan. Nomor pesanan Anda: ' + rekaman.id,
      pesanan: {
        id: rekaman.id,
        waktu: rekaman.waktu,
        produk: rekaman.produk_nama,
        jumlah: rekaman.jumlah,
        total: rekaman.total,
        metode: rekaman.metode,
        alamat: rekaman.alamat,
        lokasi_url: rekaman.lokasi_url || '',
        ongkir: rekaman.ongkir,
        status_ongkir: rekaman.status_ongkir || '',
        // Total pembayaran hanya pasti bila ongkir sudah tidak menunggu konfirmasi.
        totalPembayaran:
          rekaman.status_ongkir === 'menunggu'
            ? null
            : (Number(rekaman.total) || 0) + (Number(rekaman.ongkir) || 0),
        status: rekaman.status
      }
    });
  } catch (err) {
    console.error('[pesanan] Gagal menyimpan:', err);
    return res.status(500).json({ error: 'Pesanan gagal disimpan. Silakan coba kembali.' });
  }
});

/** GET /api/feedback — ringkasan dan daftar masukan konsumen terbaru. */
router.get('/feedback', (req, res) => {
  try {
    const daftar = storage.daftarFeedback();
    const jumlah = daftar.length;
    const total = daftar.reduce((jumlahkan, item) => jumlahkan + Number(item.rating || 0), 0);
    res.json({
      jumlah,
      rataRata: jumlah ? Math.round((total / jumlah) * 10) / 10 : 0,
      daftar: daftar.slice(0, 20).map((item) => ({
        id: item.id,
        waktu: item.waktu,
        nama: item.nama || 'Anonim',
        rating: item.rating,
        komentar: item.komentar
      }))
    });
  } catch (err) {
    console.error('[feedback] Gagal membaca data:', err);
    res.status(500).json({ error: 'Data feedback tidak dapat dimuat.' });
  }
});

/** POST /api/feedback — menyimpan rating dan komentar konsumen. */
router.post('/feedback', (req, res) => {
  const hasil = validasiFeedback(req.body);
  if (!hasil.ok) {
    return res.status(400).json({ error: hasil.error });
  }

  try {
    const rekaman = storage.tambahFeedback(hasil.data);
    return res.status(201).json({
      ok: true,
      pesan: 'Terima kasih atas masukan Anda.',
      feedback: { id: rekaman.id, rating: rekaman.rating }
    });
  } catch (err) {
    console.error('[feedback] Gagal menyimpan:', err);
    return res.status(500).json({ error: 'Masukan gagal disimpan. Silakan coba kembali.' });
  }
});

module.exports = router;
