'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Penyimpanan berbasis berkas JSON.
 * Digunakan sebagai cadangan apabila modul SQLite tidak dapat dipasang
 * atau dijalankan pada sistem Windows yang digunakan.
 */

const ARSIP = path.join(__dirname, 'toko.json');

function muatBerkas() {
  try {
    const isi = JSON.parse(fs.readFileSync(ARSIP, 'utf8'));
    return {
      pesanan: Array.isArray(isi.pesanan) ? isi.pesanan.map(normalisasiPesanan) : [],
      feedback: Array.isArray(isi.feedback) ? isi.feedback : []
    };
  } catch (err) {
    if (err.code === 'ENOENT' || err instanceof SyntaxError) {
      return { pesanan: [], feedback: [] };
    }
    throw err;
  }
}

/**
 * Melengkapi pesanan lama yang belum memiliki data metode penerimaan
 * dengan nilai bawaan: metode "jemput" dan ongkos kirim 0.
 */
function normalisasiPesanan(pesanan) {
  const hasil = Object.assign({}, pesanan);
  if (!hasil.metode) hasil.metode = 'jemput';
  if (typeof hasil.alamat !== 'string') hasil.alamat = hasil.alamat ? String(hasil.alamat) : '';
  if (!Number.isFinite(Number(hasil.jarak_km)) || hasil.jarak_km === undefined || hasil.jarak_km === null) {
    hasil.jarak_km = 0;
  }
  if (hasil.ongkir === undefined || hasil.ongkir === null || !Number.isFinite(Number(hasil.ongkir))) {
    hasil.ongkir = 0;
  }
  return hasil;
}

class JsonStore {
  constructor() {
    this.nama = 'JSON';
    this.keterangan = 'Berkas data/toko.json (cadangan)';
    this.data = muatBerkas();
  }

  siap() {
    this.simpan();
  }

  simpan() {
    const sementara = ARSIP + '.tmp';
    fs.writeFileSync(sementara, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(sementara, ARSIP);
  }

  idBerikutnya(daftar) {
    return daftar.reduce((maks, item) => Math.max(maks, Number(item.id) || 0), 0) + 1;
  }

  tambahPesanan(isi) {
    const rekaman = {
      id: this.idBerikutnya(this.data.pesanan),
      waktu: new Date().toISOString(),
      status: 'baru',
      ...isi
    };
    this.data.pesanan.push(rekaman);
    this.simpan();
    return rekaman;
  }

  daftarPesanan() {
    return this.data.pesanan.map(normalisasiPesanan).sort((a, b) => b.id - a.id);
  }

  ubahStatusPesanan(id, status) {
    const rekaman = this.data.pesanan.find((p) => Number(p.id) === Number(id));
    if (!rekaman) return null;
    rekaman.status = status;
    rekaman.diperbarui = new Date().toISOString();
    this.simpan();
    return rekaman;
  }

  tambahFeedback(isi) {
    const rekaman = {
      id: this.idBerikutnya(this.data.feedback),
      waktu: new Date().toISOString(),
      ...isi
    };
    this.data.feedback.push(rekaman);
    this.simpan();
    return rekaman;
  }

  daftarFeedback() {
    return this.data.feedback.slice().sort((a, b) => b.id - a.id);
  }
}

module.exports = JsonStore;
