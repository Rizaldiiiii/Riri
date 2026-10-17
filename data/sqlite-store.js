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

class SqliteStore {
  constructor(db, nama, keterangan) {
    this.db = db;
    this.nama = nama;
    this.keterangan = keterangan;
  }

  siap() {
    this.db.exec(SKEMA);
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
         (waktu, nama, whatsapp, produk_id, produk_nama, harga, jumlah, total, catatan, persetujuan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'baru')`,
      [
        waktu,
        isi.nama,
        isi.whatsapp,
        isi.produk_id,
        isi.produk_nama,
        isi.harga,
        isi.jumlah,
        isi.total,
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
