/* Halaman Pemesanan — pengiriman formulir dan tautan WhatsApp. */
(function () {
  'use strict';

  var form = document.getElementById('formulirPesanan');
  var kotakPesan = document.getElementById('pesanFormulir');
  var tombolKirim = document.getElementById('tombolKirim');
  var tombolWa = document.getElementById('tombolWa');
  var pilihanProduk = document.getElementById('produk');
  var jumlahInput = document.getElementById('jumlah');
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

  function varianTerpilih() {
    return varianTersimpan.find(function (v) { return v.id === pilihanProduk.value; }) || null;
  }

  function jumlahSah() {
    var nilai = Number.parseInt(jumlahInput.value, 10);
    return Number.isInteger(nilai) && nilai >= 1 && nilai <= 500 ? nilai : 0;
  }

  function perbaruiTotal() {
    var v = varianTerpilih();
    var jumlah = jumlahSah();
    perkiraanTotal.textContent = v && jumlah ? BFB.rupiah(v.harga * jumlah) : 'Rp0';
  }

  function bacaFormulir() {
    return {
      nama: document.getElementById('nama').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      produkId: pilihanProduk.value,
      jumlah: jumlahInput.value,
      catatan: document.getElementById('catatan').value.trim(),
      persetujuan: document.getElementById('persetujuan').checked
    };
  }

  function pesanWhatsApp() {
    var isi = bacaFormulir();
    var v = varianTerpilih();
    var baris = [
      'Halo BanaFitBrow, saya ingin memesan produk.',
      '',
      'Nama: ' + (isi.nama || '-'),
      'Nomor WhatsApp: ' + (isi.whatsapp || '-'),
      'Produk: ' + (v ? v.nama + ' (' + BFB.rupiah(v.harga) + ')' : (isi.produkId || '-')),
      'Jumlah: ' + (jumlahSah() || isi.jumlah || '-'),
      'Perkiraan total: ' + (v && jumlahSah() ? BFB.rupiah(v.harga * jumlahSah()) : '-'),
      'Catatan: ' + (isi.catatan || '-')
    ];

    function buka(konfig) {
      var kontak = (konfig && konfig.kontak && konfig.kontak.whatsapp) || {};
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
    tombolKirim.disabled = true;
    tombolKirim.textContent = 'Mengirim...';

    fetch('/api/pesanan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: isi.nama,
        whatsapp: isi.whatsapp,
        produkId: isi.produkId,
        jumlah: Number.parseInt(isi.jumlah, 10),
        catatan: isi.catatan,
        persetujuan: isi.persetujuan
      })
    })
      .then(function (res) {
        return res.json().then(function (data) { return { status: res.status, data: data }; });
      })
      .then(function (hasil) {
        if (hasil.status >= 200 && hasil.status < 300 && hasil.data.ok) {
          tampilkanPesan('pesan-sukses', hasil.data.pesan + ' Tim kami akan menghubungi Anda melalui WhatsApp.');
          form.reset();
          perbaruiTotal();
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
    perbaruiTotal();
  });

  pilihanProduk.addEventListener('change', perbaruiTotal);
  jumlahInput.addEventListener('input', perbaruiTotal);
  form.addEventListener('submit', kirim);
  tombolWa.addEventListener('click', function () {
    pesanWhatsApp().catch(function () {
      tampilkanPesan('pesan-galat', 'Konfigurasi produk tidak dapat dimuat.');
    });
  });
})();
