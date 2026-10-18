/* Halaman Pemesanan — pengiriman formulir, metode penerimaan, dan tautan WhatsApp. */
(function () {
  'use strict';

  var form = document.getElementById('formulirPesanan');
  var kotakPesan = document.getElementById('pesanFormulir');
  var tombolKirim = document.getElementById('tombolKirim');
  var tombolWa = document.getElementById('tombolWa');
  var pilihanProduk = document.getElementById('produk');
  var jumlahInput = document.getElementById('jumlah');
  var bidangAntar = document.getElementById('bidangAntar');
  var bidangJemput = document.getElementById('bidangJemput');
  var alamatInput = document.getElementById('alamat');
  var lokasiInput = document.getElementById('lokasiUrl');
  var alamatKantorKotak = document.getElementById('alamatKantor');
  var perkiraanSubtotal = document.getElementById('perkiraanSubtotal');
  var perkiraanOngkir = document.getElementById('perkiraanOngkir');
  var perkiraanTotal = document.getElementById('perkiraanTotal');
  var varianTersimpan = [];
  var konfigTersimpan = null;

  var TEKS_ONGKIR_MENUNGGU = 'Akan dikonfirmasi pengelola';
  var TEKS_TOTAL_MENUNGGU = 'Subtotal ditambah ongkos kirim';
  var TEKS_ONGKIR_WA = 'Ongkos kirim: akan dikonfirmasi pengelola';

  function tampilkanPesan(jenis, teks) {
    kotakPesan.className = 'pesan terlihat ' + jenis;
    kotakPesan.textContent = teks;
  }

  function bersihkanPesan() {
    kotakPesan.className = 'pesan';
    kotakPesan.textContent = '';
  }

  function varianTerpilih() {
    return varianTersimpan.find(function (v) { return v.id === pilihanProduk.value; }) || null;
  }

  function jumlahSah() {
    var nilai = Number.parseInt(jumlahInput.value, 10);
    return Number.isInteger(nilai) && nilai >= 1 && nilai <= 500 ? nilai : 0;
  }

  function metodeTerpilih() {
    var kotak = form.querySelector('input[name="metode"]:checked');
    return kotak ? kotak.value : '';
  }

  /** Alamat kantor dari konfigurasi, untuk ditampilkan pada metode jemput. */
  function teksAlamatKantor() {
    var konfig = konfigTersimpan && konfigTersimpan.pengiriman;
    return (konfig && konfig.alamatKantor) || '-';
  }

  /** Label metode penerimaan untuk pesan WhatsApp. */
  function labelMetode(metode) {
    if (metode === 'antar') return 'Antar ke lokasi pembeli';
    if (metode === 'jemput') return 'Jemput sendiri di kantor';
    return '-';
  }

  function gambarLokasi() {
    var metode = metodeTerpilih();
    bidangAntar.hidden = metode !== 'antar';
    bidangJemput.hidden = metode !== 'jemput';
    alamatInput.required = metode === 'antar';

    if (alamatKantorKotak) alamatKantorKotak.textContent = teksAlamatKantor();
  }

  function perbaruiRingkasan() {
    var v = varianTerpilih();
    var jumlah = jumlahSah();
    var subtotal = v && jumlah ? v.harga * jumlah : 0;
    var metode = metodeTerpilih();

    perkiraanSubtotal.textContent = BFB.rupiah(subtotal);

    if (metode === 'jemput') {
      perkiraanOngkir.textContent = BFB.rupiah(0);
      perkiraanTotal.textContent = BFB.rupiah(subtotal);
      return;
    }
    if (metode === 'antar') {
      perkiraanOngkir.textContent = TEKS_ONGKIR_MENUNGGU;
      perkiraanTotal.textContent = TEKS_TOTAL_MENUNGGU;
      return;
    }
    perkiraanOngkir.textContent = '—';
    perkiraanTotal.textContent = '—';
  }

  function bacaFormulir() {
    return {
      nama: document.getElementById('nama').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      produkId: pilihanProduk.value,
      jumlah: jumlahInput.value,
      catatan: document.getElementById('catatan').value.trim(),
      persetujuan: document.getElementById('persetujuan').checked,
      metode: metodeTerpilih(),
      alamat: alamatInput.value.trim(),
      lokasiUrl: lokasiInput ? lokasiInput.value.trim() : ''
    };
  }

  /** Memeriksa alamat dan tautan lokasi untuk metode antar. Mengembalikan teks galat atau null. */
  function galatLokasi(isi) {
    if (isi.alamat.length < 10 || isi.alamat.length > 300) {
      return 'Alamat lengkap tujuan pengantaran harus 10 sampai 300 karakter.';
    }
    if (isi.lokasiUrl.length > 500) {
      return 'Tautan lokasi maksimal 500 karakter.';
    }
    if (isi.lokasiUrl && !/^https?:\/\//i.test(isi.lokasiUrl)) {
      return 'Tautan lokasi harus berawalan http:// atau https://.';
    }
    return null;
  }

  function pesanWhatsApp() {
    var isi = bacaFormulir();
    var v = varianTerpilih();
    var jumlah = jumlahSah();
    var subtotal = v && jumlah ? v.harga * jumlah : 0;
    var antar = isi.metode === 'antar';

    var baris = [
      'Halo BanaFitBrow, saya ingin memesan produk.',
      '',
      'Nama: ' + (isi.nama || '-'),
      'Nomor WhatsApp: ' + (isi.whatsapp || '-'),
      'Produk: ' + (v ? v.nama + ' (' + BFB.rupiah(v.harga) + ')' : (isi.produkId || '-')),
      'Jumlah: ' + (jumlah || isi.jumlah || '-'),
      'Metode penerimaan: ' + labelMetode(isi.metode)
    ];

    if (antar) {
      baris.push('Alamat pengiriman: ' + (isi.alamat || '-'));
      if (isi.lokasiUrl) baris.push('Tautan lokasi: ' + isi.lokasiUrl);
      baris.push('Subtotal produk: ' + BFB.rupiah(subtotal));
      baris.push(TEKS_ONGKIR_WA);
      baris.push('Total pembayaran: subtotal ditambah ongkos kirim yang dikonfirmasi pengelola');
    } else if (isi.metode === 'jemput') {
      baris.push('Alamat pengiriman: diambil di kantor — ' + teksAlamatKantor());
      baris.push('Subtotal produk: ' + BFB.rupiah(subtotal));
      baris.push('Ongkos kirim: ' + BFB.rupiah(0));
      baris.push('Total pembayaran: ' + BFB.rupiah(subtotal));
    }

    baris.push('Catatan: ' + (isi.catatan || '-'));

    function buka(konfigWa) {
      var kontak = (konfigWa && konfigWa.kontak && konfigWa.kontak.whatsapp) || {};
      window.open(BFB.tautanWa(kontak.nomor, baris.join('\n')), '_blank', 'noopener');
    }

    // Konfigurasi sudah dimuat saat halaman dibuka, sehingga jendela WhatsApp
    // dapat dibuka langsung dari aksi pengguna tanpa diblokir peramban.
    if (konfigTersimpan) {
      buka(konfigTersimpan);
      return Promise.resolve();
    }
    return BFB.konfigurasi().then(buka);
  }

  function kirim(event) {
    event.preventDefault();
    bersihkanPesan();

    if (!form.checkValidity()) {
      form.reportValidity();
      tampilkanPesan('pesan-galat', 'Mohon lengkapi seluruh isian wajib pada formulir.');
      return;
    }

    var isi = bacaFormulir();

    if (isi.metode === 'antar') {
      var galat = galatLokasi(isi);
      if (galat) {
        tampilkanPesan('pesan-galat', galat);
        return;
      }
    }

    var muatan = {
      nama: isi.nama,
      whatsapp: isi.whatsapp,
      produkId: isi.produkId,
      jumlah: Number.parseInt(isi.jumlah, 10),
      catatan: isi.catatan,
      persetujuan: isi.persetujuan,
      metode: isi.metode,
      alamat: isi.metode === 'antar' ? isi.alamat : '',
      lokasiUrl: isi.metode === 'antar' ? isi.lokasiUrl : ''
    };

    tombolKirim.disabled = true;
    tombolKirim.textContent = 'Mengirim...';

    fetch('/api/pesanan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(muatan)
    })
      .then(function (res) {
        return res.json().then(function (data) { return { status: res.status, data: data }; });
      })
      .then(function (hasil) {
        if (hasil.status >= 200 && hasil.status < 300 && hasil.data.ok) {
          tampilkanPesan('pesan-sukses', hasil.data.pesan + ' Tim kami akan menghubungi Anda melalui WhatsApp.');
          form.reset();
          gambarLokasi();
          perbaruiRingkasan();
        } else {
          tampilkanPesan('pesan-galat', hasil.data.error || 'Pesanan gagal dikirim.');
        }
      })
      .catch(function () {
        tampilkanPesan('pesan-galat', 'Tidak dapat terhubung ke server. Pastikan server berjalan lalu coba kembali.');
      })
      .finally(function () {
        tombolKirim.disabled = false;
        tombolKirim.textContent = 'Kirim Pesanan';
      });
  }

  document.addEventListener('bfb:siap', function (event) {
    var cfg = event.detail;
    if (!cfg) return;
    konfigTersimpan = cfg;
    varianTersimpan = cfg.varian || [];
    gambarLokasi();
    perbaruiRingkasan();
  });

  Array.prototype.forEach.call(form.querySelectorAll('input[name="metode"]'), function (kotak) {
    kotak.addEventListener('change', function () {
      gambarLokasi();
      perbaruiRingkasan();
    });
  });

  pilihanProduk.addEventListener('change', perbaruiRingkasan);
  jumlahInput.addEventListener('input', perbaruiRingkasan);
  form.addEventListener('submit', kirim);

  if (tombolWa) {
    tombolWa.addEventListener('click', function () {
      pesanWhatsApp().catch(function () {
        tampilkanPesan('pesan-galat', 'Konfigurasi produk tidak dapat dimuat.');
      });
    });
  }
})();
