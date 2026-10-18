'use strict';

const express = require('express');
const storage = require('../data/storage');
const env = require('../config/env');
const produkData = require('../data/produk');
const { hitungOngkir } = require('../public/js/ongkir');
const {
  NAMA_KUKI,
  DURASI_SESI_MS,
  wajibAdmin,
  samakanKataSandi,
  buatTokenSesi,
  hapusSesi,
  bawaanPesanan,
  keCsv
} = require('./util');

const router = express.Router();

const STATUS_SAH = ['baru', 'diproses', 'selesai'];

/** POST /api/admin/login — memverifikasi kata sandi dari berkas .env. */
router.post('/login', (req, res) => {
  const kataSandi = req.body && req.body.kataSandi ? String(req.body.kataSandi) : '';

  if (!env.ADMIN_PASSWORD) {
    return res
      .status(500)
      .json({ error: 'Kata sandi belum diatur. Isi ADMIN_PASSWORD pada berkas .env lalu jalankan ulang server.' });
  }
  if (!samakanKataSandi(kataSandi)) {
    return res.status(401).json({ error: 'Kata sandi salah.' });
  }

  const token = buatTokenSesi();
  res.setHeader(
    'Set-Cookie',
    `${NAMA_KUKI}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(DURASI_SESI_MS / 1000)}`
  );
  res.json({ ok: true, pesan: 'Berhasil masuk.' });
});

/** POST /api/admin/logout — mengakhiri sesi. */
router.post('/logout', (req, res) => {
  const cookie = req.headers.cookie || '';
  const token = cookie
    .split(';')
    .map((bagian) => bagian.trim())
    .find((bagian) => bagian.startsWith(NAMA_KUKI + '='));
  hapusSesi(token ? token.slice(NAMA_KUKI.length + 1) : null);
  res.setHeader('Set-Cookie', `${NAMA_KUKI}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.json({ ok: true });
});

/** GET /api/admin/sesi — mengecek apakah sesi admin masih berlaku. */
router.get('/sesi', wajibAdmin, (req, res) => {
  res.json({ ok: true, login: true });
});

/** GET /api/admin/pesanan — daftar seluruh pesanan. */
router.get('/pesanan', wajibAdmin, (req, res) => {
  try {
    res.json({ daftar: storage.daftarPesanan() });
  } catch (err) {
    console.error('[admin] Gagal membaca pesanan:', err);
    res.status(500).json({ error: 'Data pesanan tidak dapat dimuat.' });
  }
});

/** PUT /api/admin/pesanan/:id/status — memperbarui status pesanan. */
router.put('/pesanan/:id/status', wajibAdmin, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const status = req.body && req.body.status ? String(req.body.status) : '';

  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Nomor pesanan tidak valid.' });
  if (!STATUS_SAH.includes(status)) {
    return res.status(400).json({ error: 'Status tidak dikenal. Pilihan: baru, diproses, selesai.' });
  }

  try {
    const rekaman = storage.ubahStatusPesanan(id, status);
    if (!rekaman) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    res.json({ ok: true, pesanan: rekaman });
  } catch (err) {
    console.error('[admin] Gagal memperbarui status:', err);
    res.status(500).json({ error: 'Status pesanan gagal diperbarui.' });
  }
});

/**
 * PUT /api/admin/pesanan/:id/ongkir — menghitung dan menyimpan ongkos kirim.
 * Isi permintaan: { jarakKm }. Jarak diukur admin melalui Google Maps,
 * ongkir dihitung di server dengan tabel tarif konfigurasi, lalu status ongkir
 * menjadi "terkonfirmasi". Hanya berlaku untuk pesanan bermetode "antar".
 */
router.put('/pesanan/:id/ongkir', wajibAdmin, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Nomor pesanan tidak valid.' });

  const jarak =
    req.body && req.body.jarakKm !== undefined && req.body.jarakKm !== null && req.body.jarakKm !== ''
      ? Number(req.body.jarakKm)
      : Number.NaN;

  try {
    const pesanan = storage.daftarPesanan().find((p) => Number(p.id) === id);
    if (!pesanan) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    if ((pesanan.metode || 'jemput') !== 'antar') {
      return res.status(400).json({ error: 'Ongkos kirim hanya dapat diisi untuk pesanan dengan metode antar.' });
    }

    const hitung = hitungOngkir(produkData.pengiriman, jarak);
    if (!hitung.ok) return res.status(400).json({ error: hitung.error });

    const terbaru = storage.ubahOngkirPesanan(id, jarak, hitung.ongkir);
    if (!terbaru) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    res.json({
      ok: true,
      pesan: 'Ongkos kirim pesanan nomor ' + id + ' berhasil disimpan.',
      pesanan: terbaru,
      totalPembayaran: (Number(terbaru.total) || 0) + hitung.ongkir
    });
  } catch (err) {
    console.error('[admin] Gagal menyimpan ongkir:', err);
    res.status(500).json({ error: 'Ongkos kirim gagal disimpan.' });
  }
});

/** GET /api/admin/pesanan.csv — ekspor data pesanan ke CSV. */
router.get('/pesanan.csv', wajibAdmin, (req, res) => {
  try {
    const daftar = storage.daftarPesanan();
    const kolom = [
      'id',
      'waktu',
      'nama',
      'whatsapp',
      'produk_id',
      'produk_nama',
      'harga',
      'jumlah',
      'total',
      'metode',
      'alamat',
      'lokasi_url',
      'jarak_km',
      'ongkir',
      'status_ongkir',
      'catatan',
      'persetujuan',
      'status'
    ];
    const isi = keCsv(
      kolom,
      daftar.map((pesanan) => {
        const baris = Object.assign({}, pesanan, bawaanPesanan(pesanan));
        // Onkir berstatus menunggu bukan ongkir terkonfirmasi: jarak dan ongkir dikosongkan.
        if (baris.status_ongkir === 'menunggu') {
          baris.jarak_km = '';
          baris.ongkir = '';
        }
        return baris;
      })
    );
    const namaBerkas = 'pesanan-banafitbrow-' + new Date().toISOString().slice(0, 10) + '.csv';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="' + namaBerkas + '"');
    res.send(isi);
  } catch (err) {
    console.error('[admin] Gagal mengekspor CSV:', err);
    res.status(500).json({ error: 'Ekspor CSV gagal.' });
  }
});

/** GET /api/admin/feedback — daftar feedback beserta rata-rata rating. */
router.get('/feedback', wajibAdmin, (req, res) => {
  try {
    const daftar = storage.daftarFeedback();
    const jumlah = daftar.length;
    const total = daftar.reduce((jumlahkan, item) => jumlahkan + Number(item.rating || 0), 0);
    res.json({
      jumlah,
      rataRata: jumlah ? Math.round((total / jumlah) * 100) / 100 : 0,
      daftar
    });
  } catch (err) {
    console.error('[admin] Gagal membaca feedback:', err);
    res.status(500).json({ error: 'Data feedback tidak dapat dimuat.' });
  }
});

/** GET /api/admin/pelanggan — data pelanggan yang dihimpun dari pesanan. */
router.get('/pelanggan', wajibAdmin, (req, res) => {
  try {
    const peta = new Map();
    for (const pesanan of storage.daftarPesanan()) {
      const kunci = pesanan.whatsapp;
      const lama = peta.get(kunci) || {
        nama: pesanan.nama,
        whatsapp: pesanan.whatsapp,
        jumlahPesanan: 0,
        jumlahItem: 0,
        totalNilai: 0,
        terakhir: pesanan.waktu
      };
      lama.jumlahPesanan += 1;
      lama.jumlahItem += Number(pesanan.jumlah) || 0;
      lama.totalNilai += Number(pesanan.total) || 0;
      if (pesanan.waktu > lama.terakhir) {
        lama.terakhir = pesanan.waktu;
        lama.nama = pesanan.nama;
      }
      peta.set(kunci, lama);
    }
    const daftar = Array.from(peta.values()).sort((a, b) => b.totalNilai - a.totalNilai);
    res.json({ jumlah: daftar.length, daftar });
  } catch (err) {
    console.error('[admin] Gagal menghimpun pelanggan:', err);
    res.status(500).json({ error: 'Data pelanggan tidak dapat dimuat.' });
  }
});

/** GET /api/admin/rekap — rekap penjualan sederhana. */
router.get('/rekap', wajibAdmin, (req, res) => {
  try {
    const daftar = storage.daftarPesanan();
    const perProduk = new Map();

    for (const pesanan of daftar) {
      const kunci = pesanan.produk_id;
      const lama = perProduk.get(kunci) || {
        produkId: pesanan.produk_id,
        produkNama: pesanan.produk_nama,
        jumlahPesanan: 0,
        jumlahItem: 0,
        totalNilai: 0
      };
      lama.jumlahPesanan += 1;
      lama.jumlahItem += Number(pesanan.jumlah) || 0;
      lama.totalNilai += Number(pesanan.total) || 0;
      perProduk.set(kunci, lama);
    }

    const perStatus = { baru: 0, diproses: 0, selesai: 0 };
    for (const pesanan of daftar) {
      if (perStatus[pesanan.status] !== undefined) perStatus[pesanan.status] += 1;
    }

    // Total ongkir hanya menghitung pesanan dengan status ongkir "terkonfirmasi";
    // pesanan berstatus "menunggu" dihitung terpisah sebagai jumlah.
    let ongkirTerkonfirmasi = 0;
    let ongkirMenunggu = 0;
    for (const pesanan of daftar) {
      const bawaan = bawaanPesanan(pesanan);
      if (bawaan.status_ongkir === 'terkonfirmasi') ongkirTerkonfirmasi += bawaan.ongkir;
      if (bawaan.status_ongkir === 'menunggu') ongkirMenunggu += 1;
    }

    res.json({
      totalPesanan: daftar.length,
      totalItem: daftar.reduce((jumlahkan, p) => jumlahkan + (Number(p.jumlah) || 0), 0),
      totalNilai: daftar.reduce((jumlahkan, p) => jumlahkan + (Number(p.total) || 0), 0),
      totalOngkir: ongkirTerkonfirmasi,
      ongkirMenunggu,
      perStatus,
      perProduk: Array.from(perProduk.values()),
      penyimpanan: storage.nama + ' — ' + storage.keterangan
    });
  } catch (err) {
    console.error('[admin] Gagal menyusun rekap:', err);
    res.status(500).json({ error: 'Rekap penjualan tidak dapat dimuat.' });
  }
});

module.exports = router;
