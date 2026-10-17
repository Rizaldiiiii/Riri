/* =========================================================================
   BanaFitBrow — skrip bersama seluruh halaman
   - Mengaktifkan menu navigasi pada tampilan ponsel
   - Memuat konfigurasi produk dari /api/produk
   - Me-render data ke elemen yang ditandai data-kunci / data-render
   ========================================================================= */
(function () {
  'use strict';

  var cacheKonfigurasi = null;
  var permintaan = null;

  function ambilNilai(objek, jalur) {
    return String(jalur)
      .split('.')
      .reduce(function (hasil, kunci) {
        return hasil === undefined || hasil === null ? undefined : hasil[kunci];
      }, objek);
  }

  function rupiah(nilai) {
    return 'Rp' + Number(nilai || 0).toLocaleString('id-ID');
  }

  function nomorBersih(nomor) {
    return String(nomor || '').replace(/\D/g, '');
  }

  function tautanWa(nomor, pesan) {
    var url = 'https://wa.me/' + nomorBersih(nomor);
    if (pesan) url += '?text=' + encodeURIComponent(pesan);
    return url;
  }

  function el(tag, kelas, teks) {
    var node = document.createElement(tag);
    if (kelas) node.className = kelas;
    if (teks !== undefined && teks !== null) node.textContent = teks;
    return node;
  }

  function lencanaContoh() {
    var span = el('span', 'lencana', 'CONTOH');
    span.title = 'Data contoh';
    return span;
  }

  function tanggalManis(iso) {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (err) {
      return iso;
    }
  }

  /* --- Perender data ---------------------------------------------------- */
  var RENDER = {
    daftar: function (node, cfg, jalur) {
      var nilai = ambilNilai(cfg, jalur) || [];
      node.innerHTML = '';
      nilai.forEach(function (isi) {
        var item = document.createElement('li');
        if (typeof isi === 'string') {
          item.textContent = isi;
        } else {
          item.textContent = isi.nama || '';
          if (isi.peran) {
            var bantuan = el('span', 'bantuan', isi.peran);
            item.appendChild(bantuan);
          }
        }
        node.appendChild(item);
      });
    },
    daftarBerterakan: function (node, cfg, jalur) {
      var nilai = ambilNilai(cfg, jalur) || [];
      node.innerHTML = '';
      nilai.forEach(function (isi) { node.appendChild(el('li', null, isi)); });
    },
    varian: function (node, cfg) {
      node.innerHTML = '';
      (cfg.varian || []).forEach(function (v) {
        var kartu = el('div', 'varian');
        var judul = el('div', 'nama', v.nama);
        kartu.appendChild(judul);
        kartu.appendChild(el('div', 'berat', 'Berat kemasan: ' + v.berat));
        var harga = el('div', 'harga', rupiah(v.harga));
        kartu.appendChild(harga);
        kartu.appendChild(el('p', 'keterangan', v.keterangan));
        node.appendChild(kartu);
      });
    },
    gizi: function (node, cfg) {
      var gizi = cfg.gizi || {};
      node.innerHTML = '';
      var tabel = el('table', 'data');
      var thead = document.createElement('thead');
      var barisJudul = document.createElement('tr');
      ['Nilai gizi', 'Per sajian', '% AKG'].forEach(function (teks) {
        barisJudul.appendChild(el('th', null, teks));
      });
      thead.appendChild(barisJudul);
      tabel.appendChild(thead);

      var tbody = document.createElement('tbody');
      (gizi.tabel || []).forEach(function (baris) {
        var tr = document.createElement('tr');
        if (baris.sorotan) tr.className = 'sorotan';
        tr.appendChild(el('td', null, baris.nama));
        tr.appendChild(el('td', null, baris.jumlah));
        tr.appendChild(el('td', null, baris.persen || '-'));
        tbody.appendChild(tr);
      });
      tabel.appendChild(tbody);
      node.appendChild(tabel);
    },
    media: function (node, cfg) {
      node.innerHTML = '';
      (cfg.mediaSosial || []).forEach(function (media) {
        var a = document.createElement('a');
        a.className = 'tautan-media';
        a.href = media.tautan || '#';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        var isi = el('span', null, '');
        isi.appendChild(el('span', 'nama', media.nama));
        isi.appendChild(el('span', 'keterangan', media.keterangan || ''));
        isi.querySelector('.keterangan').style.display = 'block';
        a.appendChild(isi);
        a.appendChild(el('span', 'panah', '→'));
        node.appendChild(a);
      });
    },
    kontakWa: function (node, cfg) {
      var kontak = (cfg.kontak && cfg.kontak.whatsapp) || {};
      node.href = tautanWa(kontak.nomor, kontak.pesanAwal);
    },
    produkPilihan: function (node, cfg) {
      node.innerHTML = '';
      var placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '— Pilih produk —';
      node.appendChild(placeholder);
      (cfg.varian || []).forEach(function (v) {
        var opsi = document.createElement('option');
        opsi.value = v.id;
        opsi.textContent = v.nama + ' — ' + rupiah(v.harga);
        node.appendChild(opsi);
      });
    },
    ringkasanGizi: function (node, cfg) {
      var protein = (cfg.gizi && cfg.gizi.tabel || []).find(function (b) { return b.sorotan; });
      node.innerHTML = '';
      if (!protein) return;
      var angka = el('div', 'angka', protein.jumlah);
      node.appendChild(angka);
      node.appendChild(el('div', 'keterangan', 'Protein per sajian'));
    },
    catatanContoh: function (node, cfg) {
      node.textContent = (cfg.proyek && cfg.proyek.catatanContoh) || '';
    }
  };

  function terapkanKonfigurasi(cfg) {
    var berkasKunci = document.querySelectorAll('[data-kunci]');
    Array.prototype.forEach.call(berkasKunci, function (node) {
      var nilai = ambilNilai(cfg, node.getAttribute('data-kunci'));
      if (nilai !== undefined && nilai !== null) node.textContent = nilai;
    });

    var berkasRender = document.querySelectorAll('[data-render]');
    Array.prototype.forEach.call(berkasRender, function (node) {
      var nama = node.getAttribute('data-render');
      var jalur = node.getAttribute('data-sumber');
      var fungsi = RENDER[nama];
      if (typeof fungsi === 'function') fungsi(node, cfg, jalur);
    });
  }

  function tampilkanGalat(pesan) {
    var kotak = document.querySelector('[data-galat]');
    if (kotak) {
      kotak.textContent = pesan;
      kotak.classList.add('terlihat');
    }
  }

  function konfigurasi() {
    if (cacheKonfigurasi) return Promise.resolve(cacheKonfigurasi);
    if (!permintaan) {
      permintaan = fetch('/api/produk')
        .then(function (res) {
          if (!res.ok) throw new Error('Permintaan gagal (' + res.status + ')');
          return res.json();
        })
        .then(function (data) {
          cacheKonfigurasi = data;
          return data;
        });
    }
    return permintaan;
  }

  function siapkanHalaman() {
    return konfigurasi()
      .then(function (cfg) {
        terapkanKonfigurasi(cfg);
        document.dispatchEvent(new CustomEvent('bfb:siap', { detail: cfg }));
        return cfg;
      })
      .catch(function (err) {
        console.error(err);
        tampilkanGalat('Data produk tidak dapat dimuat. Pastikan server berjalan, lalu muat ulang halaman.');
        document.dispatchEvent(new CustomEvent('bfb:siap', { detail: null }));
      });
  }

  /* --- Navigasi --------------------------------------------------------- */
  function aturNavigasi() {
    var tombol = document.getElementById('tombolMenu');
    var nav = document.getElementById('navigasi');
    if (tombol && nav) {
      tombol.addEventListener('click', function () {
        var terbuka = nav.classList.toggle('terbuka');
        tombol.setAttribute('aria-expanded', terbuka ? 'true' : 'false');
      });
    }

    var jalur = window.location.pathname.replace(/\/$/, '') || '/';
    Array.prototype.forEach.call(document.querySelectorAll('#navigasi a'), function (a) {
      var tujuan = a.getAttribute('href').replace(/\.html$/, '').replace(/\/$/, '') || '/';
      if (tujuan === jalur || (tujuan !== '/' && jalur.indexOf(tujuan) === 0)) {
        a.classList.add('aktif');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  function aturTahun() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tahun]'), function (node) {
      node.textContent = String(new Date().getFullYear());
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    aturNavigasi();
    aturTahun();
    siapkanHalaman();
  });

  window.BFB = {
    konfigurasi: konfigurasi,
    siapkanHalaman: siapkanHalaman,
    rupiah: rupiah,
    tautanWa: tautanWa,
    nomorBersih: nomorBersih,
    tanggalManis: tanggalManis,
    el: el,
    lencanaContoh: lencanaContoh,
    tampilkanGalat: tampilkanGalat
  };
})();
