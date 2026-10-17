/* Halaman Pemesanan — pengiriman formulir, metode penerimaan, ongkos kirim, dan tautan WhatsApp. */
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
  var jarakInput = document.getElementById('jarak');
  var petunjukJarak = document.getElementById('petunjukJarak');
  var infoJarak = document.getElementById('infoJarak');
  var alamatKantorKotak = document.getElementById('alamatKantor');
  var perkiraanSubtotal = document.getElementById('perkiraanSubtotal');
  var perkiraanOngkir = document.getElementById('perkiraanOngkir');
  var perkiraanTotal = document.getElementById('perkiraanTotal');
  var varianTersimpan = [];
  var konfigTersimpan = null;

  function tampilkanPesan(jenis, teks) {
    kotakPesan.className = 'pesan terlihat ' + jenis;
    kotakPesan.textContent = teks;
  }

  function bersihkanPesan() {
    kotakPesan.className = 'pesan';
    kotakPesan.textContent = '';
  }

  function konfigurasiPengiriman() {
    return (konfigTersimpan && konfigTersimpan.pengiriman) || null;
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
    var konfig = konfigurasiPengiriman();
    return (konfig && konfig.alamatKantor) || '-';
  }

  /**
   * Hasil perhitungan ongkir untuk kondisi formulir saat ini.
   * status: 'ok' (dapat dihitung), 'kosong' (belum diisi), 'galat' (tidak sah)
   */
  function hasilOngkir() {
    var metode = metodeTerpilih();
    if (metode === 'jemput') return { status: 'ok', ongkir: 0 };
    if (metode !== 'antar') return { status: 'kosong', ongkir: 0 };

    var konfig = konfigurasiPengiriman();
    if (!konfig || jarakInput.value.trim() === '') return { status: 'kosong', ongkir: 0 };

    var hasil = BfbOngkir.hitungOngkir(konfig, Number(jarakInput.value));
    return hasil.ok
      ? { status: 'ok', ongkir: hasil.ongkir }
      : { status: 'galat', ongkir: 0, error: hasil.error };
  }

  function gambarLokasi() {
    var metode = metodeTerpilih();
    bidangAntar.hidden = metode !== 'antar';
    bidangJemput.hidden = metode !== 'jemput';
    alamatInput.required = metode === 'antar';
    jarakInput.required = metode === 'antar';

    if (alamatKantorKotak) alamatKantorKotak.textContent = teksAlamatKantor();
  }

  function gambarPetunjukJarak() {
    var konfig = konfigurasiPengiriman();
    var maks = konfig && Number(konfig.jarakMaksKm);
    var dasar =
      'Periksa jarak dari kantor ke lokasi Anda melalui Google Maps, lalu isi perkiraan jaraknya dalam kilometer (contoh 4,5).';
    if (Number.isFinite(maks) && maks > 0) {
      jarakInput.max = String(maks);
      dasar += ' Jarak maksimal yang dilayani ' + BfbOngkir.teksJarak(maks) + ' km.';
    }
    if (petunjukJarak) petunjukJarak.textContent = dasar;
  }

  function perbaruiRingkasan() {
    var v = varianTerpilih();
    var jumlah = jumlahSah();
    var subtotal = v && jumlah ? v.harga * jumlah : 0;
    var metode = metodeTerpilih();
    var hasil = hasilOngkir();

    perkiraanSubtotal.textContent = BFB.rupiah(subtotal);
    infoJarak.textContent = hasil.status === 'galat' ? hasil.error : '';

    if (metode !== 'jemput' && metode !== 'antar') {
      perkiraanOngkir.textContent = '—';
      perkiraanTotal.textContent = '—';
      return;
    }
    if (hasil.status === 'ok') {
      perkiraanOngkir.textContent = BFB.rupiah(hasil.ongkir);
      perkiraanTotal.textContent = BFB.rupiah(subtotal + hasil.ongkir);
      return;
    }
    perkiraanOngkir.textContent = '—';
    perkiraanTotal.textContent = '—';
    if (metode === 'antar' && hasil.status === 'kosong' && !infoJarak.textContent) {
      infoJarak.textContent = 'Isi perkiraan jarak untuk menghitung ongkos kirim.';
    }
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
      jarak: jarakInput.value.trim()
    };
  }

  /** Memeriksa alamat dan jarak untuk metode antar. Mengembalikan teks galat atau null. */
  function galatLokasi(isi, konfig) {
    if (isi.alamat.length < 10 || isi.alamat.length > 300) {
      return 'Alamat lengkap tujuan pengantaran harus 10 sampai 300 karakter.';
    }
    if (isi.jarak === '') return 'Perkiraan jarak dari kantor wajib diisi.';

    var hasil = BfbOngkir.hitungOngkir(konfig, Number(isi.jarak));
    if (!hasil.ok) return hasil.error;
    return null;
  }

  function pesanWhatsApp() {
    var isi = bacaFormulir();
    var v = varianTerpilih();
    var jumlah = jumlahSah();
    var subtotal = v && jumlah ? v.harga * jumlah : 0;
    var konfig = konfigurasiPengiriman();
    var antar = isi.metode === 'antar';
    var hasil = antar && konfig ? BfbOngkir.hitungOngkir(konfig, Number(isi.jarak)) : null;
    var ongkir = isi.metode === 'jemput' ? 0 : hasil && hasil.ok ? hasil.ongkir : 0;

    var baris = [
      'Halo BanaFitBrow, saya ingin memesan produk.',
      '',
      'Nama: ' + (isi.nama || '-'),
      'Nomor WhatsApp: ' + (isi.whatsapp || '-'),
      'Produk: ' + (v ? v.nama + ' (' + BFB.rupiah(v.harga) + ')' : (isi.produkId || '-')),
      'Jumlah: ' + (jumlah || isi.jumlah || '-'),
      'Metode penerimaan: ' + BfbOngkir.labelMetode(isi.metode)
    ];

    if (antar) {
      baris.push('Alamat pengiriman: ' + (isi.alamat || '-'));
      baris.push('Perkiraan jarak: ' + (isi.jarak ? BfbOngkir.teksJarak(isi.jarak) + ' km' : '-'));
    } else if (isi.metode === 'jemput') {
      baris.push('Alamat pengiriman: diambil di kantor — ' + teksAlamatKantor());
    }

    baris.push(
      'Subtotal produk: ' + BFB.rupiah(subtotal),
      'Ongkos kirim (perkiraan): ' + BFB.rupiah(ongkir),
      'Total pembayaran: ' + BFB.rupiah(subtotal + ongkir),
      'Catatan: ' + (isi.catatan || '-')
    );

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

    function kirimKeServer(konfig) {
      if (!konfig) {
        tampilkanPesan(
          'pesan-galat',
          'Konfigurasi ongkos kirim belum tersedia. Muat ulang halaman lalu coba kembali.'
        );
        return;
      }

      if (isi.metode === 'antar') {
        var galat = galatLokasi(isi, konfig);
        if (galat) {
          tampilkanPesan('pesan-galat', galat);
          infoJarak.textContent = galat;
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
        jarak: isi.metode === 'antar' ? Number(isi.jarak) : undefined
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

    if (konfigTersimpan) {
      kirimKeServer(konfigTersimpan);
    } else {
      BFB.konfigurasi()
        .then(function (konfig) {
          konfigTersimpan = konfig;
          kirimKeServer(konfig);
        })
        .catch(function () {
          tampilkanPesan('pesan-galat', 'Konfigurasi produk tidak dapat dimuat. Muat ulang halaman lalu coba kembali.');
        });
    }
  }

  document.addEventListener('bfb:siap', function (event) {
    var cfg = event.detail;
    if (!cfg) return;
    konfigTersimpan = cfg;
    varianTersimpan = cfg.varian || [];
    gambarPetunjukJarak();
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
  jarakInput.addEventListener('input', perbaruiRingkasan);
  form.addEventListener('submit', kirim);

  if (tombolWa) {
    tombolWa.addEventListener('click', function () {
      pesanWhatsApp().catch(function () {
        tampilkanPesan('pesan-galat', 'Konfigurasi produk tidak dapat dimuat.');
      });
    });
  }
})();