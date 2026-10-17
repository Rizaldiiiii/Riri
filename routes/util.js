'use strict';

const crypto = require('crypto');

/** Utilitas bersama untuk seluruh rute API. */

const NAMA_KUKI = 'banafit_sesi';
const DURASI_SESI_MS = 8 * 60 * 60 * 1000; // 8 jam

/** Token sesi aktif: token → waktu kedaluwarsa (milidetik). */
const sesiAktif = new Map();

function parseKuki(header, nama) {
  if (!header) return null;
  for (const bagian of String(header).split(';')) {
    const potong = bagian.indexOf('=');
    if (potong === -1) continue;
    if (bagian.slice(0, potong).trim() === nama) {
      return decodeURIComponent(bagian.slice(potong + 1).trim());
    }
  }
  return null;
}

function buatTokenSesi() {
  const token = crypto.randomBytes(32).toString('hex');
  sesiAktif.set(token, Date.now() + DURASI_SESI_MS);
  return token;
}

function perpanjangSesi(token) {
  const kedaluwarsa = sesiAktif.get(token);
  if (!kedaluwarsa) return false;
  if (kedaluwarsa < Date.now()) {
    sesiAktif.delete(token);
    return false;
  }
  sesiAktif.set(token, Date.now() + DURASI_SESI_MS);
  return true;
}

function hapusSesi(token) {
  if (token) sesiAktif.delete(token);
}

/** Middleware: memastikan permintaan berasal dari admin yang sudah masuk. */
function wajibAdmin(req, res, next) {
  const token = parseKuki(req.headers.cookie, NAMA_KUKI);
  if (!token || !perpanjangSesi(token)) {
    return res.status(401).json({ error: 'Sesi tidak valid. Silakan masuk kembali.' });
  }
  req.tokenSesi = token;
  next();
}

function samakanKataSandi(terkirim) {
  const disimpan = process.env.ADMIN_PASSWORD || '';
  if (!disimpan) return false;
  const a = crypto.createHash('sha256').update(String(terkirim)).digest();
  const b = crypto.createHash('sha256').update(disimpan).digest();
  return crypto.timingSafeEqual(a, b) && String(terkirim).length > 0;
}

function teks(value, panjangMaks) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, panjangMaks);
}

/**
 * Validasi isi formulir pemesanan.
 * @returns {{ok: true, data: object}|{ok: false, error: string}}
 */
function validasiPesanan(body, daftarVarian) {
  const nama = teks(body && body.nama, 100);
  const whatsapp = teks(body && body.whatsapp, 25).replace(/[^\d+]/g, '');
  const produkId = teks(body && body.produkId, 50);
  const catatan = teks(body && body.catatan, 500);
  const jumlah = Number.parseInt(body && body.jumlah, 10);
  const persetujuan = Boolean(body && body.persetujuan);

  if (nama.length < 3) return { ok: false, error: 'Nama minimal 3 karakter.' };
  if (!/^\+?\d{8,16}$/.test(whatsapp)) {
    return { ok: false, error: 'Nomor WhatsApp tidak valid. Gunakan angka, contoh 6281234567890.' };
  }
  if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 500) {
    return { ok: false, error: 'Jumlah pesanan harus berupa angka 1 sampai 500.' };
  }
  if (!persetujuan) {
    return { ok: false, error: 'Persetujuan penggunaan data pelanggan wajib dicentang.' };
  }

  const varian = daftarVarian.find((v) => v.id === produkId);
  if (!varian) return { ok: false, error: 'Pilihan produk tidak dikenal.' };

  return {
    ok: true,
    data: {
      nama,
      whatsapp,
      produk_id: varian.id,
      produk_nama: varian.nama,
      harga: Number(varian.harga) || 0,
      jumlah,
      total: (Number(varian.harga) || 0) * jumlah,
      catatan,
      persetujuan: 1
    }
  };
}

/** Validasi isi formulir feedback. */
function validasiFeedback(body) {
  const nama = teks(body && body.nama, 60);
  const komentar = teks(body && body.komentar, 500);
  const rating = Number.parseInt(body && body.rating, 10);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'Rating harus berupa angka 1 sampai 5.' };
  }
  if (komentar.length < 3) return { ok: false, error: 'Komentar minimal 3 karakter.' };

  return { ok: true, data: { nama, rating, komentar } };
}

/** Mengubah baris data menjadi teks CSV (dengan BOM agar kompatibel Excel). */
function keCsv(kolom, baris) {
  const sel = (nilai) => {
    const teksNilai = String(nilai === undefined || nilai === null ? '' : nilai);
    return '"' + teksNilai.replace(/"/g, '""') + '"';
  };
  const garis = [kolom.map(sel).join(',')];
  for (const barisData of baris) {
    garis.push(kolom.map((k) => sel(barisData[k])).join(','));
  }
  return '\uFEFF' + garis.join('\r\n') + '\r\n';
}

module.exports = {
  NAMA_KUKI,
  DURASI_SESI_MS,
  parseKuki,
  buatTokenSesi,
  perpanjangSesi,
  hapusSesi,
  wajibAdmin,
  samakanKataSandi,
  validasiPesanan,
  validasiFeedback,
  keCsv
};
