'use strict';

const { bukaSqlite } = require('./sqlite-store');
const JsonStore = require('./json-store');

/**
 * Pemilih lapisan penyimpanan.
 * Prioritas: SQLite (node:sqlite / better-sqlite3) → JSON.
 * Pemilihan dilakukan satu kali ketika aplikasi dimulai.
 */
function pilihStore() {
  let store = null;

  try {
    store = bukaSqlite();
    if (store) store.siap();
  } catch (err) {
    console.warn('[penyimpanan] SQLite gagal disiapkan:', err.message);
    store = null;
  }

  if (!store) {
    console.log('[penyimpanan] Menggunakan penyimpanan JSON (data/toko.json).');
    store = new JsonStore();
    store.siap();
  } else {
    console.log('[penyimpanan] Menggunakan penyimpanan ' + store.nama + ' — ' + store.keterangan);
  }

  return store;
}

module.exports = pilihStore();
