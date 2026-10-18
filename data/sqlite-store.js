'use strict';

const path = require('path');

/**
 * Penyimpanan berbasis SQLite.
 * Mendukung dua penyedia:
 *   1. "node:sqlite" (modul bawaan Node.js >= 22.5) — tanpa kompilasi.
 *   2. "better-sqlite3" (opsional, dipasang melalui npm).
 * Keduanya memiliki antarmuka yang sama: prepare(sql).run/get/all(...params).
 */

const BERKAS_DB = path.join(__dirname, 'banafitbrow.db');

const SKEMA = `
CREATE TABLE IF NOT EXISTS pesanan (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  waktu       TEXT    NOT NULL,
  nama        TEXT    NOT NULL,
  whatsapp    TEXT    NOT NULL,
  produk_id   TEXT    NOT NULL,
  produk_nama TEXT    NOT NULL,
  harga       INTEGER NOT NULL,
  jumlah      INTEGER NOT NULL,
  total       INTEGER NOT NULL,
  catatan     TEXT    NOT NULL DEFAULT '',
  persetujuan INTEGER NOT NULL DEFAULT 0,
  metode         TEXT    NOT NULL DEFAULT 'jemput',
  alamat         TEXT    NOT NULL DEFAULT '',
  lokasi_url     TEXT    NOT NULL DEFAULT '',
  jarak_km       REAL    NOT NULL DEFAULT 0,
  ongkir         INTEGER NOT NULL DEFAULT 0,
  status_ongkir  TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL DEFAULT 'baru',
  diperbarui  TEXT
);
CREATE TABLE IF NOT EXISTS feedback (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  waktu    TEXT    NOT NULL,
  nama     TEXT    NOT NULL DEFAULT '',
  rating   INTEGER NOT NULL,
  komentar TEXT    NOT NULL DEFAULT ''
);
`;

/** Kolom baru fitur metode penerimaan dan ongkos kirim beserta nilai bawaannya. */
const MIGRASI_PESANAN = [
  ["metode", "TEXT NOT NULL DEFAULT 'jemput'"],
  ["alamat", "TEXT NOT NULL DEFAULT ''"],
  ['lokasi_url', "TEXT NOT NULL DEFAULT ''"],
  ['jarak_km', 'REAL NOT NULL DEFAULT 0'],
  ['ongkir', 'INTEGER NOT NULL DEFAULT 0'],
  ['status_ongkir', "TEXT NOT NULL DEFAULT ''"]
];

/**
 * Melengkapi status ongkos kirim pesanan lama berdasarkan isinya:
 * jemput menjadi "tidak_perlu"; antar dengan jarak terisi menjadi "terkonfirmasi";
 * antar tanpa jarak menjadi "menunggu". Baris yang sudah memiliki status dilewati.
 */
const MIGRASI_STATUS_ONGKIR = `
UPDATE pesanan
   SET status_ongkir = CASE
     WHEN metode = 'antar' AND jarak_km > 0 THEN 'terkonfirmasi'
     WHEN metode = 'antar' THEN 'menunggu'
     ELSE 'tidak_perlu'
   END
 WHERE status_ongkir IS NULL OR status_ongkir = ''`;

class SqliteStore {
  constructor(db, nama, keterangan) {
    this.db = db;
    this.nama = nama;
    this.keterangan = keterangan;
  }

  siap() {
    this.db.exec(SKEMA);
    this.migrasiPesanan();
    try {
      this.jalankan(MIGRASI_STATUS_ONGKIR);
    } catch (err) {
      console.warn('[penyimpanan] Status ongkir pesanan lama tidak dapat dilengkapi:', err.message);
    }
  }

  /**
   * Menambahkan kolom baru pada tabel pesanan bila belum ada (ALTER TABLE ... ADD COLUMN),
   * sehingga basis data lama tetap utuh dan pesanan lama tetap valid
   * dengan nilai bawaan metode "jemput" dan ongkos kirim 0.
   */
  migrasiPesanan() {
    let kolom = [];
    try {
      kolom = this.semua("PRAGMA table_info('pesanan')").map((baris) => baris.name);
    } catch (err) {
      console.warn('[penyimpanan] Kolom tabel pesanan tidak dapat dibaca:', err.message);
      return;
    }

    const punya = new Set(kolom);
    for (const [nama, jenis] of MIGRASI_PESANAN) {
      if (punya.has(nama)) continue;
      try {
        this.jalankan('ALTER TABLE pesanan ADD COLUMN ' + nama + ' ' + jenis);
        console.log('[penyimpanan] Kolom baru ditambahkan: pesanan.' + nama);
      } catch (err) {
        console.warn('[penyimpanan] Gagal menambah kolom pesanan.' + nama + ':', err.message);
      }
    }
  }

  semua(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }

  satu(sql, params = []) {
    return this.db.prepare(sql).get(...params);
  }

  jalankan(sql, params = []) {
    return this.db.prepare(sql).run(...params);
  }

  tutup() {
    try {
      this.db.close();
    } catch (err) {
      /* abaikan */
    }
  }

  cariTerakhir(tabel) {
    return this.satu('SELECT * FROM ' + tabel + ' ORDER BY id DESC LIMIT 1');
  }

  tambahPesanan(isi) {
    const waktu = new Date().toISOString();
    const hasil = this.jalankan(
      `INSERT INTO pesanan
         (waktu, nama, whatsapp, produk_id, produk_nama, harga, jumlah, total,
          metode, alamat, lokasi_url, jarak_km, ongkir, status_ongkir, catatan, persetujuan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'baru')`,
      [
        waktu,
        isi.nama,
        isi.whatsapp,
        isi.produk_id,
        isi.produk_nama,
        isi.harga,
        isi.jumlah,
        isi.total,
        isi.metode || 'jemput',
        isi.alamat || '',
        isi.lokasi_url || '',
        Number(isi.jarak_km) || 0,
        Number(isi.ongkir) || 0,
        isi.status_ongkir || '',
        isi.catatan,
        isi.persetujuan ? 1 : 0
      ]
    );
    const id = Number(hasil.lastInsertRowid);
    const rekaman = Number.isFinite(id) ? this.satu('SELECT * FROM pesanan WHERE id = ?', [id]) : null;
    return rekaman || this.cariTerakhir('pesanan');
  }

  daftarPesanan() {
    return this.semua('SELECT * FROM pesanan ORDER BY id DESC');
  }

  /**
   * Menyimpan hasil pengukuran jarak admin: jarak_km, ongkir,
   * dan status ongkir "terkonfirmasi".
   */
  ubahOngkirPesanan(id, jarakKm, ongkir) {
    const ada = this.satu('SELECT id FROM pesanan WHERE id = ?', [Number(id)]);
    if (!ada) return null;
    this.jalankan(
      'UPDATE pesanan SET jarak_km = ?, ongkir = ?, status_ongkir = ?, diperbarui = ? WHERE id = ?',
      [Number(jarakKm), Number(ongkir), 'terkonfirmasi', new Date().toISOString(), Number(id)]
    );
    return this.satu('SELECT * FROM pesanan WHERE id = ?', [Number(id)]);
  }

  ubahStatusPesanan(id, status) {
    const ada = this.satu('SELECT id FROM pesanan WHERE id = ?', [Number(id)]);
    if (!ada) return null;
    this.jalankan('UPDATE pesanan SET status = ?, diperbarui = ? WHERE id = ?', [
      status,
      new Date().toISOString(),
      Number(id)
    ]);
    return this.satu('SELECT * FROM pesanan WHERE id = ?', [Number(id)]);
  }

  tambahFeedback(isi) {
    const waktu = new Date().toISOString();
    const hasil = this.jalankan('INSERT INTO feedback (waktu, nama, rating, komentar) VALUES (?, ?, ?, ?)', [
      waktu,
      isi.nama,
      isi.rating,
      isi.komentar
    ]);
    const id = Number(hasil.lastInsertRowid);
    const rekaman = Number.isFinite(id) ? this.satu('SELECT * FROM feedback WHERE id = ?', [id]) : null;
    return rekaman || this.cariTerakhir('feedback');
  }

  daftarFeedback() {
    return this.semua('SELECT * FROM feedback ORDER BY id DESC');
  }
}

/**
 * Membuka berkas basis data SQLite.
 * @returns {SqliteStore|null} null jika penyedia SQLite tidak tersedia.
 */
function bukaSqlite() {
  // 1. Modul bawaan Node.js
  try {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(BERKAS_DB);
    return new SqliteStore(db, 'SQLite', 'Berkas data/banafitbrow.db (node:sqlite)');
  } catch (err) {
    if (err && err.code !== 'ERR_UNKNOWN_BUILTIN_MODULE' && err.code !== 'MODULE_NOT_FOUND') {
      console.warn('[penyimpanan] node:sqlite tidak dapat digunakan:', err.message);
    }
  }

  // 2. better-sqlite3 (opsional)
  try {
    const Database = require('better-sqlite3');
    const db = new Database(BERKAS_DB);
    return new SqliteStore(db, 'SQLite', 'Berkas data/banafitbrow.db (better-sqlite3)');
  } catch (err) {
    if (err && err.code !== 'MODULE_NOT_FOUND') {
      console.warn('[penyimpanan] better-sqlite3 tidak dapat digunakan:', err.message);
    }
  }

  return null;
}

module.exports = { bukaSqlite, BERKAS_DB };
