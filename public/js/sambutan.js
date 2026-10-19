/* Pop-up sambutan: tampil sekali per kunjungan pada halaman beranda. */
(function () {
  'use strict';

  var KUNCI = 'bfbSambutanTampil';

  try {
    if (window.sessionStorage.getItem(KUNCI)) return;
  } catch (err) { /* abaikan */ }

  var dariQr = new URLSearchParams(window.location.search).get('sumber') === 'qr';
  var fokusSebelumnya = document.activeElement;

  function tutup() {
    document.removeEventListener('keydown', saatTombol);
    if (lapisan.parentNode) lapisan.parentNode.removeChild(lapisan);
    document.body.classList.remove('sambutan-terbuka');
    try { window.sessionStorage.setItem(KUNCI, '1'); } catch (err) { /* abaikan */ }
    if (fokusSebelumnya && fokusSebelumnya.focus) fokusSebelumnya.focus();
  }

  function saatTombol(event) {
    if (event.key === 'Escape') tutup();
    if (event.key === 'Tab') { event.preventDefault(); tombol.focus(); }
  }

  var lapisan = document.createElement('div');
  lapisan.className = 'sambutan-lapisan';

  var kartu = document.createElement('div');
  kartu.className = 'sambutan-kartu';
  kartu.setAttribute('role', 'dialog');
  kartu.setAttribute('aria-modal', 'true');
  kartu.setAttribute('aria-labelledby', 'sambutanJudul');

  var logo = document.createElement('img');
  logo.src = '/assets/logo-banafitbrow.png';
  logo.alt = 'Logo BanaFitBrow';
  kartu.appendChild(logo);

  if (dariQr) {
    var lencana = document.createElement('div');
    lencana.className = 'sambutan-lencana';
    lencana.textContent = '✓ QR Code berhasil dipindai';
    kartu.appendChild(lencana);
  }

  var judul = document.createElement('h2');
  judul.id = 'sambutanJudul';
  judul.textContent = 'Selamat Datang di BanaFitBrow';
  kartu.appendChild(judul);

  var isi = document.createElement('p');
  isi.textContent =
    'Terima kasih telah mengunjungi BanaFitBrow. Pada halaman ini Anda dapat melihat informasi produk, ' +
    'komposisi dan kandungan gizi, serta melakukan pemesanan.';
  kartu.appendChild(isi);

  var tombol = document.createElement('button');
  tombol.type = 'button';
  tombol.className = 'tombol tombol-utama';
  tombol.textContent = 'Mulai Jelajahi';
  tombol.addEventListener('click', tutup);
  kartu.appendChild(tombol);

  lapisan.appendChild(kartu);
  lapisan.addEventListener('click', function (event) {
    if (event.target === lapisan) tutup();
  });

  document.body.appendChild(lapisan);
  document.body.classList.add('sambutan-terbuka');
  document.addEventListener('keydown', saatTombol);
  tombol.focus();
})();