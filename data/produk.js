'use strict';

/**
 * ============================================================================
 * BanaFitBrow — BERKAS KONFIGURASI DATA PRODUK
 * ----------------------------------------------------------------------------
 * SELURUH DATA PADA BERKAS INI ADALAH DATA CONTOH dan ditandai dengan label
 * "CONTOH". Ganti dengan data resmi sebelum website dipublikasikan.
 *
 * Data yang tercakup:
 *   - Judul proyek, nama produk, slogan, ringkasan, deskripsi FIX
 *   - Keunggulan dan cara penyimpanan FIX
 *   - Daftar bahan serta tabel kandungan gizi per sajian FIX
 *   - Varian produk beserta harga FIX
 *   - Metode penerimaan, alamat kantor, batas jarak, dan tarif ongkos kirim FIX
 *   - Nomor WhatsApp dan akun media sosial FIX (SOSMED CONTOH)
 * ============================================================================
 */

module.exports = {
  proyek: {
    judul:
      'BanaFitBrow: Kreasi Brownies Tinggi Protein Berbahan Pisang, Oat, dan Whey Protein dengan Smart Packaging Berbasis QR Code dan Digitalisasi Sistem Pemasaran'
  },

  produk: {
    nama: 'BanaFitBrow',
    slogan: 'Brownies tinggi protein dari pisang, oat, dan whey protein.',
    ringkasan:
      'BanaFitBrow adalah brownies tinggi protein yang dibuat dari pisang, oat, dan whey protein. Produk ini dirancang untuk memenuhi kebutuhan makanan ringan yang praktis, bergizi, dan mudah dijangkau melalui pemindaian QR Code pada kemasan.',
    deskripsi:
      'BanaFitBrow merupakan produk brownies tinggi protein yang memadukan pisang matang sebagai pemanis alami, oat sebagai sumber serat, serta whey protein sebagai sumber protein utama. Tekstur brownies lembut dengan rasa cokelat yang khas menjadikan produk ini cocok dikonsumsi sebagai camilan sehari-hari, pendamping aktivitas olahraga, maupun bekal bekerja dan belajar. Kemasan BanaFitBrow dilengkapi QR Code yang mengarah ke halaman ini sehingga konsumen dapat memperoleh informasi produk, melakukan pemesanan, dan menyampaikan masukan secara langsung.'
  },

  keunggulan: [
    'Mengandung protein dari whey protein dan oat untuk membantu memenuhi kebutuhan protein harian.',
    'Menggunakan pisang matang sebagai pemanis alami sehingga rasa tetap seimbang.',
    'Kaya serat berkat kandungan oat.',
    'Kemasan praktis dan mudah dibawa ke mana saja.',
    'Dilengkapi QR Code pada kemasan sebagai pintu informasi dan pemesanan (smart packaging).',
  ],

  caraPenyimpanan: [
    'Simpan di tempat kering dan sejuk, jauh dari sinar matahari langsung.',
    'Hindari penyimpanan pada suhu tinggi agar tekstur dan rasa tetap terjaga.',
    'Periksa tanggal kedaluwarsa yang tercetak pada kemasan sebelum dikonsumsi.',
    'Jika ditemukan perubahan warna, aroma, atau tekstur, jangan dikonsumsi.'
  ],

  bahanUtama: [
    { nama: 'Pisang matang', peran: 'Pemanis alami dan sumber serat' },
    { nama: 'Oat', peran: 'Sumber serat dan karbohidrat kompleks' },
    { nama: 'Whey protein', peran: 'Sumber protein utama' }
  ],

  bahan: [
    { nama: 'Pisang matang', peran: 'Mengandung serat, vitamin, mineral, dan kalium yang bermanfaat bagi tubuh.' },
    { nama: 'Rolled oats', peran: 'Mengandung serat β-glukan yang membantu meningkatkan rasa kenyang.' },
    { nama: 'Whey protein', peran: 'Sumber protein berkualitas tinggi yang mendukung pembentukan protein otot.' },
    { nama: 'Cocoa powder', peran: 'Mengandung polifenol, terutama flavanol, yang memiliki aktivitas antioksidan.' },
    { nama: 'Telur', peran: 'Sumber protein berkualitas tinggi serta vitamin dan kolin.' },
    { nama: 'Madu', peran: 'Sebagai pemanis dan sumber karbohidrat.' },
    { nama: 'Garam', peran: 'Membantu menyeimbangkan dan memperkuat cita rasa brownies.' },
    { nama: 'Margarin', peran: 'Memberikan rasa gurih dan membantu menghasilkan tekstur brownies yang lembut dan fudgy.' },
    { nama: 'Baking powder', peran: 'Berfungsi sebagai bahan pengembang agar adonan lebih mengembang.' },
    { nama: 'Dark chocolate chips', peran: 'Menambah cita rasa cokelat dan membuat tampilan brownies lebih menarik.' },
  ],

  gizi: {
    porsi: '1 kotak berisi 1 brownies (berat 70 gram)',
    tabel: [
      { nama: 'Energi', jumlah: '232 kkal', persen: '11% AKG', sorotan: false },
      { nama: 'Protein', jumlah: '11 gram', persen: '18,33% AKG', sorotan: true },
      { nama: 'Lemak total', jumlah: '9 gram', persen: '13% AKG', sorotan: false },
      { nama: 'Karbohidrat total', jumlah: '30 gram', persen: '9% AKG', sorotan: false },
      { nama: 'Serat', jumlah: '4 gram', persen: '13% AKG', sorotan: false },
      { nama: 'Gula', jumlah: '9 gram', persen: '18% AKG', sorotan: false }
    ],
    ket: 'AKG = Angka Kecukupan Gizi harian untuk dewasa.'
  },

  varian: [
    {
      id: 'klasik',
      nama: 'BanaFitBrow Original',
      berat: '70 gram',
      harga: 19000,
      keterangan: 'Rasa cokelat klasik dengan kandungan protein 11 gram per sajian.'
    },
  ],

  /**
   * Konfigurasi metode penerimaan dan ongkos kirim.
   * Berkas ini adalah satu-satunya sumber data tarif, batas jarak, dan alamat kantor.
   * Data dikirim ke peramban melalui /api/produk lalu dipakai oleh logika hitung ongkir
   * yang sama di server maupun tampilan (public/js/ongkir.js).
   */
  pengiriman: {
    // Ganti dengan alamat resmi kantor/pusat produksi sebelum website dipublikasikan.
    alamatKantor: 'ALAMAT KANTOR (isi dengan alamat resmi)',
    // Jarak terjauh yang dilayani, dalam kilometer.
    jarakMaksKm: 100,
    // Tarif berdasarkan batas jarak menaik (kilometer terjauh pada baris tersebut).
    tarif: [
      { sampaiKm: 3, tarif: 6000 },
      { sampaiKm: 5, tarif: 9000 },
      { sampaiKm: 10, tarif: 15000 },
      { sampaiKm: 15, tarif: 22000 },
      { sampaiKm: 20, tarif: 30000 },
      { sampaiKm: 30, tarif: 42000 },
      { sampaiKm: 40, tarif: 55000 }
    ],
    // Jarak di atas setelahKm: tarifAwal + tarifPerKm untuk tiap kilometer lebihnya,
    // dibulatkan ke atas per kilometer. tarifAwal sama dengan tarif baris terakhir tabel.
    tarifPanjang: { setelahKm: 40, tarifAwal: 55000, tarifPerKm: 1500 }
  },

  kontak: {
    whatsapp: {
      label: 'WhatsApp Pemesanan BanaFitBrow',
      nomor: '6281341406659',
      pesanAwal: 'Halo BanaFitBrow, saya ingin memesan produk. Mohon informasinya.'
    }
  },

  mediaSosial: [
    {
      nama: 'Instagram',
      keterangan: 'Informasi produk, promo, dan dokumentasi kegiatan.',
      tautan: 'https://www.instagram.com/contoh.banafitbrow/'
    },
    {
      nama: 'TikTok',
      keterangan: 'Video resep, proses produksi, dan ulasan produk.',
      tautan: 'https://www.tiktok.com/@contoh.banafitbrow'
    },
    {
      nama: 'WhatsApp',
      keterangan: 'Kanal pemesanan dan layanan konsumen.',
      tautan: 'https://wa.me/6281341406659'
    }
  ]
};
