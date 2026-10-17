/* Halaman Komposisi dan Gizi — mengisi tabel bahan dari konfigurasi produk. */
(function () {
  'use strict';

  function isiBahan(cfg) {
    var tbody = document.getElementById('daftarBahan');
    if (!tbody || !cfg || !cfg.bahan) return;
    tbody.innerHTML = '';
    cfg.bahan.forEach(function (bahan) {
      var tr = document.createElement('tr');
      var tdNama = document.createElement('td');
      tdNama.textContent = bahan.nama;
      var tdPeran = document.createElement('td');
      tdPeran.className = 'bungkus';
      tdPeran.textContent = bahan.peran;
      tr.appendChild(tdNama);
      tr.appendChild(tdPeran);
      tbody.appendChild(tr);
    });
  }

  document.addEventListener('bfb:siap', function (event) {
    if (event.detail) isiBahan(event.detail);
  });
})();
