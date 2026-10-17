/* =========================================================================
   BanaFitBrow — logika hitung ongkos kirim (berkas bersama)
   Berkas ini dipakai TANPA PERUBAHAN oleh dua sisi:
     - server   : require('../public/js/ongkir') pada routes/util.js
     - tampilan : <script src="/js/ongkir.js"> lalu global BfbOngkir
   Seluruh data tarif, batas jarak, dan alamat kantor berada pada data/produk.js
   (kunci `pengiriman`) dan dikirim ke peramban melalui /api/produk.
   ========================================================================= */
(function (jendela, pabrik) {
  'use strict';

  if (typeof module === 'object' && module && module.exports) {
    module.exports = pabrik();
  } else {
    jendela.BfbOngkir = pabrik();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var METODE_JEMPUT = 'jemput';
  var METODE_ANTAR = 'antar';

  /** Menampilkan angka kilometer dengan koma desimal (kebiasaan Indonesia). */
  function teksJarak(nilai) {
    return String(nilai).replace('.', ',');
  }

  /** Label metode penerimaan untuk keperluan tampilan. */
  function labelMetode(metode) {
    if (metode === METODE_ANTAR) return 'Antar ke lokasi pembeli';
    if (metode === METODE_JEMPUT) return 'Jemput sendiri di kantor';
    return '-';
  }

  /**
   * Menghitung ongkos kirim berdasarkan perkiraan jarak.
   * @param {object} konfigNilai Isi kunci `pengiriman` dari data/produk.js.
   * @param {*} jarakKm Perkiraan jarak dalam kilometer (boleh desimal).
   * @returns {{ok: true, ongkir: number}|{ok: false, error: string}}
   */
  function hitungOngkir(konfigNilai, jarakKm) {
    var konfig = konfigNilai || {};
    var daftarTarif = Array.isArray(konfig.tarif) ? konfig.tarif : [];
    if (!daftarTarif.length || !konfig.tarifPanjang) {
      return { ok: false, error: 'Konfigurasi tarif ongkos kirim belum tersedia.' };
    }

    var jarak = typeof jarakKm === 'number' ? jarakKm : Number(jarakKm);
    if (!Number.isFinite(jarak)) {
      return { ok: false, error: 'Perkiraan jarak harus berupa angka.' };
    }
    if (jarak <= 0) {
      return { ok: false, error: 'Perkiraan jarak harus lebih besar dari 0 km.' };
    }

    var maks = Number(konfig.jarakMaksKm);
    if (Number.isFinite(maks) && jarak > maks) {
      return {
        ok: false,
        error: 'Perkiraan jarak melebihi batas layanan maksimal ' + teksJarak(maks) + ' km.'
      };
    }

    var terurut = daftarTarif.slice().sort(function (a, b) {
      return Number(a.sampaiKm) - Number(b.sampaiKm);
    });

    for (var i = 0; i < terurut.length; i += 1) {
      if (jarak <= Number(terurut[i].sampaiKm)) {
        var tarif = Math.round(Number(terurut[i].tarif) || 0);
        return { ok: true, ongkir: Math.max(0, tarif) };
      }
    }

    // Jarak melampaui seluruh baris tabel: tarif awal + tarif per km tambahan,
    // dengan pembulatan ke atas untuk setiap kilometer yang dimulai.
    var panjang = konfig.tarifPanjang;
    var setelahKm = Number(panjang.setelahKm);
    if (!Number.isFinite(setelahKm)) {
      return { ok: false, error: 'Konfigurasi tarif ongkos kirim belum tersedia.' };
    }
    var kmTambahan = Math.ceil(Math.max(0, jarak - setelahKm));
    var tarifAwal = Number(panjang.tarifAwal) || 0;
    var tarifPerKm = Number(panjang.tarifPerKm) || 0;
    return { ok: true, ongkir: Math.max(0, Math.round(tarifAwal + kmTambahan * tarifPerKm)) };
  }

  return {
    METODE_JEMPUT: METODE_JEMPUT,
    METODE_ANTAR: METODE_ANTAR,
    hitungOngkir: hitungOngkir,
    labelMetode: labelMetode,
    teksJarak: teksJarak
  };
});