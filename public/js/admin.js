/* Dashboard Admin — autentikasi sederhana, pesanan, feedback, pelanggan, rekap, dan QR. */
(function () {
  'use strict';

  var layarMasuk = document.getElementById('layarMasuk');
  var layarDasbor = document.getElementById('layarDasbor');
  var formulirMasuk = document.getElementById('formulirMasuk');
  var pesanMasuk = document.getElementById('pesanMasuk');
  var pesanDasbor = document.getElementById('pesanDasbor');

  var STATUS_SAH = ['baru', 'diproses', 'selesai'];
  var dataPesanan = [];
  var urutanTerbaru = false;

  function tampilkan(kotak, jenis, teks) {
    kotak.className = (kotak.id === 'pesanMasuk' ? 'pesan' : 'pesan') + ' terlihat ' + jenis;
    kotak.textContent = teks;
  }

  function minta(url, opsi) {
    return fetch(url, opsi).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw Object.assign(new Error(data.error || 'Permintaan gagal'), { status: res.status });
        return data;
      });
    });
  }

  function selStatus(pesanan) {
    var sel = document.createElement('select');
    sel.setAttribute('aria-label', 'Status pesanan nomor ' + pesanan.id);
    sel.style.font = 'inherit';
    sel.style.fontSize = '0.88rem';
    sel.style.padding = '6px 8px';
    sel.style.borderRadius = '8px';
    sel.style.border = '1.5px solid var(--garis)';

    STATUS_SAH.forEach(function (status) {
      var opsi = document.createElement('option');
      opsi.value = status;
      opsi.textContent = status;
      if (status === pesanan.status) opsi.selected = true;
      sel.appendChild(opsi);
    });

    sel.addEventListener('change', function () {
      sel.disabled = true;
      minta('/api/admin/pesanan/' + pesanan.id + '/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: sel.value })
      })
        .then(function () {
          pesanan.status = sel.value;
          tampilkan(pesanDasbor, 'pesan-sukses', 'Status pesanan nomor ' + pesanan.id + ' diperbarui menjadi "' + sel.value + '".');
        })
        .catch(function (err) {
          sel.value = pesanan.status;
          tampilkan(pesanDasbor, 'pesan-galat', err.message || 'Status gagal diperbarui.');
        })
        .finally(function () { sel.disabled = false; });
    });

    return sel;
  }

  function selSpans(status) {
    var span = document.createElement('span');
    span.className = 'status status-' + status;
    span.textContent = status;
    return span;
  }

  function td(teks, kelas) {
    var cell = document.createElement('td');
    if (kelas) cell.className = kelas;
    cell.textContent = teks === undefined || teks === null ? '-' : teks;
    return cell;
  }

  function kosong(baris, kolom) {
    var tr = document.createElement('tr');
    var cell = document.createElement('td');
    cell.colSpan = kolom;
    cell.className = 'tidak-ada';
    cell.textContent = 'Belum ada data.';
    tr.appendChild(cell);
    return tr;
  }

  /** Normalisasi nomor WhatsApp menjadi format internasional (awalan 0 menjadi 62). */
  function nomorWaIndonesia(nomor) {
    var bersih = BFB.nomorBersih(nomor);
    if (bersih.charAt(0) === '0') bersih = '62' + bersih.slice(1);
    return bersih;
  }

  /** Konfigurasi pengiriman (tabel tarif) untuk pratinjau dan perhitungan ongkir. */
  function konfigPengiriman() {
    return BFB.konfigurasi().then(function (cfg) {
      return (cfg && cfg.pengiriman) || null;
    });
  }

  /**
   * Kotak isian jarak untuk pesanan antar yang ongkirnya masih menunggu:
   * pratinjau ongkir saat jarak diketik, lalu tombol "Hitung dan Simpan".
   */
  function kotakHitungOngkir(p) {
    var bungkus = document.createElement('span');
    bungkus.style.display = 'block';
    bungkus.style.marginTop = '6px';

    var penanda = document.createElement('span');
    penanda.className = 'status status-menunggu';
    penanda.textContent = 'Ongkir menunggu';
    bungkus.appendChild(penanda);

    var baris = document.createElement('span');
    baris.style.display = 'flex';
    baris.style.flexWrap = 'wrap';
    baris.style.gap = '6px';
    baris.style.alignItems = 'center';
    baris.style.marginTop = '6px';

    var input = document.createElement('input');
    input.type = 'number';
    input.min = '0.1';
    input.step = 'any';
    input.placeholder = 'Jarak (km)';
    input.setAttribute('aria-label', 'Jarak pesanan nomor ' + p.id + ' dalam kilometer');
    input.style.width = '112px';
    input.style.font = 'inherit';
    input.style.fontSize = '0.88rem';
    input.style.padding = '6px 8px';
    input.style.borderRadius = '8px';
    input.style.border = '1.5px solid var(--garis)';

    var tombol = document.createElement('button');
    tombol.type = 'button';
    tombol.className = 'tombol tombol-utama tombol-kecil';
    tombol.textContent = 'Hitung dan Simpan';

    var pratinjau = document.createElement('span');
    pratinjau.className = 'teks-redup';
    pratinjau.style.display = 'block';
    pratinjau.style.fontSize = '0.85rem';
    pratinjau.style.marginTop = '4px';

    input.addEventListener('input', function () {
      var nilai = input.value.trim();
      if (nilai === '') {
        pratinjau.textContent = '';
        return;
      }
      konfigPengiriman().then(function (konfig) {
        if (!konfig) {
          pratinjau.textContent = 'Konfigurasi tarif ongkos kirim belum tersedia.';
          return;
        }
        var hasil = BfbOngkir.hitungOngkir(konfig, Number(nilai));
        pratinjau.textContent = hasil.ok
          ? 'Pratinjau ongkir: ' + BFB.rupiah(hasil.ongkir)
          : hasil.error;
      });
    });

    tombol.addEventListener('click', function () {
      var nilai = Number(input.value);
      if (input.value.trim() === '' || !Number.isFinite(nilai)) {
        tampilkan(pesanDasbor, 'pesan-galat', 'Isi jarak pesanan nomor ' + p.id + ' dalam kilometer terlebih dahulu.');
        return;
      }
      tombol.disabled = true;
      tombol.textContent = 'Menyimpan...';
      minta('/api/admin/pesanan/' + p.id + '/ongkir', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jarakKm: nilai })
      })
        .then(function (data) {
          var indeks = -1;
          dataPesanan.forEach(function (lain, i) {
            if (Number(lain.id) === Number(p.id)) indeks = i;
          });
          if (indeks > -1 && data.pesanan) dataPesanan[indeks] = data.pesanan;
          tampilkan(
            pesanDasbor,
            'pesan-sukses',
            data.pesan || 'Ongkos kirim pesanan nomor ' + p.id + ' berhasil disimpan.'
          );
          gambarPesanan();
        })
        .catch(function (err) {
          tampilkan(pesanDasbor, 'pesan-galat', err.message || 'Ongkos kirim gagal disimpan.');
        })
        .finally(function () {
          tombol.disabled = false;
          tombol.textContent = 'Hitung dan Simpan';
        });
    });

    baris.appendChild(input);
    baris.appendChild(tombol);
    bungkus.appendChild(baris);
    bungkus.appendChild(pratinjau);
    return bungkus;
  }

  /** Tombol "Konfirmasi via WhatsApp" menuju nomor pembeli dengan rincian biaya. */
  function tombolKonfirmasiWa(p, subtotal, ongkir, menunggu) {
    var bungkus = document.createElement('span');
    bungkus.style.display = 'block';
    bungkus.style.marginTop = '6px';

    var tombol = document.createElement('button');
    tombol.type = 'button';
    tombol.className = 'tombol tombol-cokelat tombol-kecil';
    tombol.textContent = 'Konfirmasi via WhatsApp';
    tombol.addEventListener('click', function () {
      var baris = [
        'Halo ' + (p.nama || 'Pembeli') + ',',
        'Konfirmasi pesanan BanaFitBrow nomor ' + p.id + ':',
        'Produk: ' + p.produk_nama + ' x ' + p.jumlah,
        'Subtotal: ' + BFB.rupiah(subtotal)
      ];
      if (menunggu) {
        baris.push('Ongkos kirim: akan dikonfirmasi pengelola');
        baris.push('Total pembayaran: subtotal ditambah ongkos kirim yang dikonfirmasi pengelola');
      } else {
        baris.push('Ongkos kirim: ' + BFB.rupiah(ongkir));
        baris.push('Total pembayaran: ' + BFB.rupiah(subtotal + ongkir));
      }
      window.open(BFB.tautanWa(nomorWaIndonesia(p.whatsapp), baris.join('\n')), '_blank', 'noopener');
    });
    bungkus.appendChild(tombol);
    return bungkus;
  }

  /* --- Muat data --------------------------------------------------------- */
  function gambarPesanan() {
    var tbody = document.getElementById('isiPesanan');
    tbody.innerHTML = '';
    if (!dataPesanan.length) { tbody.appendChild(kosong(0, 9)); return; }

    var daftar = dataPesanan.slice().sort(function (a, b) {
      return urutanTerbaru ? b.id - a.id : a.id - b.id;
    });

    daftar.forEach(function (p, indeks) {
      var metode = p.metode === 'antar' ? 'antar' : 'jemput';
      var subtotal = Number(p.total) || 0;
      var ongkir = Number(p.ongkir) || 0;
      var alamat = p.alamat || '';
      var lokasiUrl = typeof p.lokasi_url === 'string' ? p.lokasi_url : '';
      var jarak = Number(p.jarak_km) || 0;
      var catatan = p.catatan || '';
      var statusOngkir = p.status_ongkir || (metode === 'antar' ? (jarak > 0 ? 'terkonfirmasi' : 'menunggu') : 'tidak_perlu');
      var menunggu = statusOngkir === 'menunggu';

      function garis(teks, meredup) {
        var span = document.createElement('span');
        span.style.display = 'block';
        span.textContent = teks;
        if (meredup) {
          span.className = 'teks-redup';
          span.style.fontSize = '0.85rem';
        }
        return span;
      }

      var tr = document.createElement('tr');
      tr.appendChild(td(indeks + 1));
      tr.appendChild(td(BFB.tanggalManis(p.waktu)));
      tr.appendChild(td(p.nama, 'bungkus'));
      tr.appendChild(td(p.produk_nama, 'bungkus'));
      tr.appendChild(td(p.jumlah));

      // Total pembayaran = total produk + ongkos kirim (kolom total tetap subtotal produk).
      // Onkir yang masih menunggu konfirmasi tidak dihitung sebagai ongkir terkonfirmasi.
      var cellTotal = document.createElement('td');
      if (menunggu) {
        cellTotal.appendChild(document.createTextNode(BFB.rupiah(subtotal)));
        cellTotal.appendChild(garis('Ongkir menunggu konfirmasi', true));
      } else {
        cellTotal.appendChild(document.createTextNode(BFB.rupiah(subtotal + ongkir)));
        cellTotal.appendChild(
          garis('Produk ' + BFB.rupiah(subtotal) + ' · Ongkir ' + BFB.rupiah(ongkir), true)
        );
      }
      tr.appendChild(cellTotal);

      var cellStatus = document.createElement('td');
      cellStatus.appendChild(selStatus(p));
      var chip = document.createElement('span');
      chip.style.display = 'block';
      chip.style.marginTop = '6px';
      chip.appendChild(selSpans(p.status));
      cellStatus.appendChild(chip);
      tr.appendChild(cellStatus);

      tr.appendChild(td(p.whatsapp));

      var cellKeterangan = document.createElement('td');
      cellKeterangan.className = 'bungkus';
      cellKeterangan.appendChild(garis('Metode: ' + (metode === 'antar' ? 'Antar' : 'Jemput'), false));
      if (metode === 'antar') {
        cellKeterangan.appendChild(garis('Alamat: ' + (alamat || '-'), true));
        if (lokasiUrl && /^https?:\/\//i.test(lokasiUrl)) {
          var cellLokasi = document.createElement('span');
          cellLokasi.style.display = 'block';
          cellLokasi.style.fontSize = '0.85rem';
          var aLokasi = document.createElement('a');
          aLokasi.href = lokasiUrl;
          aLokasi.target = '_blank';
          aLokasi.rel = 'noopener noreferrer';
          aLokasi.textContent = 'Buka tautan lokasi';
          cellLokasi.appendChild(aLokasi);
          cellKeterangan.appendChild(cellLokasi);
        }
      }
      if (menunggu) {
        cellKeterangan.appendChild(garis('Ongkir: menunggu konfirmasi pengelola', true));
      } else {
        if (metode === 'antar' && jarak > 0) {
          cellKeterangan.appendChild(garis('Jarak: ' + BfbOngkir.teksJarak(jarak) + ' km', true));
        }
        cellKeterangan.appendChild(garis('Ongkir: ' + BFB.rupiah(ongkir), true));
      }
      if (catatan) cellKeterangan.appendChild(garis('Catatan: ' + catatan, true));
      if (menunggu) cellKeterangan.appendChild(kotakHitungOngkir(p));
      cellKeterangan.appendChild(tombolKonfirmasiWa(p, subtotal, ongkir, menunggu));
      tr.appendChild(cellKeterangan);

      tbody.appendChild(tr);
    });
  }

  function muatPesanan() {
    return minta('/api/admin/pesanan').then(function (data) {
      dataPesanan = data.daftar;
      gambarPesanan();
    });
  }

  function muatFeedback() {
    return minta('/api/admin/feedback').then(function (data) {
      document.getElementById('ringkasRating').textContent = data.jumlah ? data.rataRata + ' / 5' : '—';
      document.getElementById('ringkasJumlah').textContent = data.jumlah;
      document.getElementById('statRating').textContent = data.jumlah ? data.rataRata + ' / 5' : '—';

      var tbody = document.getElementById('isiFeedback');
      tbody.innerHTML = '';
      if (!data.daftar.length) { tbody.appendChild(kosong(0, 5)); return; }

      data.daftar.forEach(function (f) {
        var tr = document.createElement('tr');
        tr.appendChild(td(f.id));
        tr.appendChild(td(BFB.tanggalManis(f.waktu)));
        tr.appendChild(td(f.nama || 'Anonim'));
        tr.appendChild(td(f.rating + ' / 5'));
        tr.appendChild(td(f.komentar, 'bungkus'));
        tbody.appendChild(tr);
      });
    });
  }

  function muatPelanggan() {
    return minta('/api/admin/pelanggan').then(function (data) {
      var tbody = document.getElementById('isiPelanggan');
      tbody.innerHTML = '';
      if (!data.daftar.length) { tbody.appendChild(kosong(0, 6)); return; }

      data.daftar.forEach(function (c) {
        var tr = document.createElement('tr');
        tr.appendChild(td(c.nama, 'bungkus'));
        tr.appendChild(td(c.whatsapp));
        tr.appendChild(td(c.jumlahPesanan));
        tr.appendChild(td(c.jumlahItem));
        tr.appendChild(td(BFB.rupiah(c.totalNilai)));
        tr.appendChild(td(BFB.tanggalManis(c.terakhir)));
        tbody.appendChild(tr);
      });
    });
  }

  function muatRekap() {
    return minta('/api/admin/rekap').then(function (data) {
      document.getElementById('statPesanan').textContent = data.totalPesanan;
      document.getElementById('statItem').textContent = data.totalItem;
      document.getElementById('statNilai').textContent = BFB.rupiah(data.totalNilai);
      document.getElementById('statNilaiProduk').textContent = BFB.rupiah(data.totalNilai);
      document.getElementById('statOngkir').textContent = BFB.rupiah(data.totalOngkir || 0);
      document.getElementById('statOngkirMenunggu').textContent = data.ongkirMenunggu || 0;
      document.getElementById('statOngkirMenungguRekap').textContent = data.ongkirMenunggu || 0;
      document.getElementById('infoPenyimpanan').textContent = data.penyimpanan;

      var tbodyStatus = document.getElementById('isiStatus');
      tbodyStatus.innerHTML = '';
      STATUS_SAH.forEach(function (status) {
        var tr = document.createElement('tr');
        var cell = document.createElement('td');
        cell.appendChild(selSpans(status));
        tr.appendChild(cell);
        tr.appendChild(td(data.perStatus[status] || 0));
        tbodyStatus.appendChild(tr);
      });

      var tbodyProduk = document.getElementById('isiPerProduk');
      tbodyProduk.innerHTML = '';
      if (!data.perProduk.length) {
        tbodyProduk.appendChild(kosong(0, 4));
      } else {
        data.perProduk.forEach(function (p) {
          var tr = document.createElement('tr');
          tr.appendChild(td(p.produkNama, 'bungkus'));
          tr.appendChild(td(p.jumlahPesanan));
          tr.appendChild(td(p.jumlahItem));
          tr.appendChild(td(BFB.rupiah(p.totalNilai)));
          tbodyProduk.appendChild(tr);
        });
      }
    });
  }

  function muatSemua() {
    pesanDasbor.className = 'pesan';
    return Promise.all([muatPesanan(), muatFeedback(), muatPelanggan(), muatRekap()])
      .then(function () { return true; })
      .catch(function (err) {
        tampilkan(pesanDasbor, 'pesan-galat', err.message || 'Data gagal dimuat.');
        return false;
      });
  }

  /* --- Layar ------------------------------------------------------------ */
  function tampilkanDasbor() {
    layarMasuk.classList.add('sembunyi');
    layarDasbor.classList.remove('sembunyi');
    BFB.konfigurasi().then(function (cfg) {
      if (cfg && cfg.proyek) {
        document.getElementById('alamatQr').textContent = window.location.origin;
      }
    }).catch(function () { /* abaikan */ });
    muatSemua();
  }

  function tampilkanMasuk() {
    layarDasbor.classList.add('sembunyi');
    layarMasuk.classList.remove('sembunyi');
  }

  formulirMasuk.addEventListener('submit', function (event) {
    event.preventDefault();
    pesanMasuk.className = 'pesan';
    var kataSandi = document.getElementById('kataSandi').value;

    if (!kataSandi) {
      tampilkan(pesanMasuk, 'pesan-galat', 'Kata sandi wajib diisi.');
      return;
    }

    minta('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kataSandi: kataSandi })
    })
      .then(function () {
        formulirMasuk.reset();
        tampilkanDasbor();
      })
      .catch(function (err) {
        tampilkan(pesanMasuk, 'pesan-galat', err.message || 'Gagal masuk.');
      });
  });

  document.getElementById('tombolKeluar').addEventListener('click', function () {
    minta('/api/admin/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .catch(function () { /* abaikan */ })
      .finally(function () { tampilkanMasuk(); });
  });

  document.getElementById('tombolMuat').addEventListener('click', function () {
    tampilkan(pesanDasbor, 'pesan-info', 'Memuat ulang data...');
    muatSemua().then(function () {
      tampilkan(pesanDasbor, 'pesan-sukses', 'Data berhasil dimuat ulang.');
    });
  });

    document.getElementById('urutanPesanan').addEventListener('change', function (event) {
    urutanTerbaru = event.target.value === 'baru';
    gambarPesanan();
  });

  /* --- Tab -------------------------------------------------------------- */
  var tabIds = ['pesanan', 'feedback', 'pelanggan', 'rekap', 'qr'];
  tabIds.forEach(function (id) {
    var tombol = document.getElementById('tab-' + id);
    tombol.addEventListener('click', function () {
      tabIds.forEach(function (lain) {
        var panel = document.getElementById('panel-' + lain);
        var aktif = lain === id;
        document.getElementById('tab-' + lain).setAttribute('aria-selected', aktif ? 'true' : 'false');
        panel.hidden = !aktif;
      });
    });
  });

  /* --- Pemeriksaan sesi -------------------------------------------------- */
  minta('/api/admin/sesi')
    .then(tampilkanDasbor)
    .catch(tampilkanMasuk);
})();
