/* Halaman Feedback — pengiriman rating dan komentar. */
(function () {
  'use strict';

  var form = document.getElementById('formulirFeedback');
  var kotakPesan = document.getElementById('pesanFeedback');
  var tombolKirim = document.getElementById('tombolKirimFeedback');
  var nilaiRating = document.getElementById('nilaiRating');
  var rataRataEl = document.getElementById('rataRata');
  var jumlahEl = document.getElementById('jumlahFeedback');
  var daftarEl = document.getElementById('daftarFeedback');

  var LABEL = ['', 'Sangat kurang', 'Kurang', 'Cukup', 'Puas', 'Sangat puas'];

  function tampilkanPesan(jenis, teks) {
    kotakPesan.className = 'pesan terlihat ' + jenis;
    kotakPesan.textContent = teks;
  }

  function bintang(jumlah) {
    return '★'.repeat(jumlah) + '☆'.repeat(5 - jumlah);
  }

  function muatFeedback() {
    return fetch('/api/feedback')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        rataRataEl.textContent = data.jumlah ? data.rataRata + ' / 5' : '—';
        jumlahEl.textContent = data.jumlah;
        daftarEl.innerHTML = '';

        if (!data.daftar || !data.daftar.length) {
          daftarEl.innerHTML = '<p class="tidak-ada">Belum ada feedback yang masuk.</p>';
          return;
        }

        data.daftar.forEach(function (item) {
          var kartu = document.createElement('div');
          kartu.className = 'kartu';
          kartu.style.boxShadow = 'none';

          var judul = document.createElement('div');
          judul.style.display = 'flex';
          judul.style.justifyContent = 'space-between';
          judul.style.gap = '8px';

          var nama = document.createElement('strong');
          nama.textContent = item.nama || 'Anonim';
          nama.style.color = 'var(--cokelat)';

          var rating = document.createElement('span');
          rating.textContent = bintang(item.rating);
          rating.style.color = 'var(--kuning)';
          rating.setAttribute('aria-label', 'Rating ' + item.rating + ' dari 5');

          judul.appendChild(nama);
          judul.appendChild(rating);

          var komentar = document.createElement('p');
          komentar.textContent = item.komentar;
          komentar.style.margin = '8px 0 4px';

          var waktu = document.createElement('span');
          waktu.className = 'teks-redup';
          waktu.textContent = BFB.tanggalManis(item.waktu);

          kartu.appendChild(judul);
          kartu.appendChild(komentar);
          kartu.appendChild(waktu);
          daftarEl.appendChild(kartu);
        });
      })
      .catch(function () {
        daftarEl.innerHTML = '<p class="tidak-ada">Data feedback tidak dapat dimuat.</p>';
      });
  }

  Array.prototype.forEach.call(form.querySelectorAll('input[name="rating"]'), function (radio) {
    radio.addEventListener('change', function () {
      nilaiRating.textContent = radio.value + ' dari 5 — ' + LABEL[Number(radio.value)];
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    kotakPesan.className = 'pesan';

    if (!form.checkValidity()) {
      form.reportValidity();
      tampilkanPesan('pesan-galat', 'Mohon pilih rating dan isi komentar Anda.');
      return;
    }

    var rating = form.querySelector('input[name="rating"]:checked');
    tombolKirim.disabled = true;
    tombolKirim.textContent = 'Mengirim...';

    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: Number.parseInt(rating.value, 10),
        nama: document.getElementById('namaFeedback').value.trim(),
        komentar: document.getElementById('komentar').value.trim()
      })
    })
      .then(function (res) {
        return res.json().then(function (data) { return { status: res.status, data: data }; });
      })
      .then(function (hasil) {
        if (hasil.status >= 200 && hasil.status < 300 && hasil.data.ok) {
          tampilkanPesan('pesan-sukses', hasil.data.pesan);
          form.reset();
          nilaiRating.textContent = 'Belum ada rating dipilih';
          return muatFeedback();
        }
        tampilkanPesan('pesan-galat', hasil.data.error || 'Feedback gagal dikirim.');
      })
      .catch(function () {
        tampilkanPesan('pesan-galat', 'Tidak dapat terhubung ke server. Pastikan server berjalan lalu coba kembali.');
      })
      .finally(function () {
        tombolKirim.disabled = false;
        tombolKirim.textContent = 'Kirim Feedback';
      });
  });

  muatFeedback();
})();
