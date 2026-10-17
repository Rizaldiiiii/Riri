'use strict';

/**
 * Generator QR Code untuk kemasan BanaFitBrow.
 *
 * Pemakaian:
 *   npm run qr                → qr/banafitbrow-qr.png (512 px)
 *   npm run qr -- 1024        → qr/banafitbrow-qr.png (1024 px)
 *   npm run qr -- 512 https://contoh.com
 *
 * Alamat tujuan diambil dari SITE_URL pada berkas .env.
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const env = require('../config/env');

const UKURAN = Number.parseInt(process.argv[2], 10);
const URL_KUSTOM = process.argv[3];

const ukuran = Number.isFinite(UKURAN) ? Math.min(Math.max(UKURAN, 128), 2048) : 512;

let tautan = env.SITE_URL;
if (URL_KUSTOM) {
  try {
    tautan = new URL(URL_KUSTOM).toString();
  } catch (err) {
    console.error('URL tidak valid:', URL_KUSTOM);
    process.exit(1);
  }
}

const folderKeluaran = path.join(__dirname, '..', 'qr');
const berkasKeluaran = path.join(folderKeluaran, 'banafitbrow-qr.png');

async function utama() {
  fs.mkdirSync(folderKeluaran, { recursive: true });
  await QRCode.toFile(berkasKeluaran, tautan, {
    type: 'png',
    width: ukuran,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#3A2317', light: '#FFFFFF' }
  });
  console.log('QR Code berhasil dibuat.');
  console.log('  Berkas : ' + path.relative(process.cwd(), berkasKeluaran));
  console.log('  Ukuran : ' + ukuran + ' px');
  console.log('  Tujuan : ' + tautan);
}

utama().catch((err) => {
  console.error('Gagal membuat QR Code:', err.message);
  process.exit(1);
});
