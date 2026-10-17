# BanaFitBrow

**BanaFitBrow: Kreasi Brownies Tinggi Protein Berbahan Pisang, Oat, dan Whey Protein dengan Smart Packaging Berbasis QR Code dan Digitalisasi Sistem Pemasaran**

Website produk BanaFitBrow — brownies tinggi protein berbahan pisang, oat, dan whey protein. Website ini dirancang *mobile-first* karena diakses konsumen melalui QR Code pada kemasan (*smart packaging*), sekaligus menjadi sarana digitalisasi sistem pemasaran: pemesanan, feedback konsumen, dan dashboard pengelolaan data.

---

## Daftar Isi

1. [Deskripsi Proyek](#deskripsi-proyek)
2. [Struktur Folder](#struktur-folder)
3. [Prasyarat](#prasyarat)
4. [Cara Instalasi](#cara-instalasi)
5. [Cara Menjalankan](#cara-menjalankan)
6. [Mengatur Berkas .env](#mengatur-berkas-env)
7. [Bagian A — Halaman Konsumen](#bagian-a--halaman-konsumen)
8. [Bagian B — Dashboard Admin](#bagian-b--dashboard-admin)
9. [Bagian C — Generator QR Code](#bagian-c--generator-qr-code)
10. [Penyimpanan Data (SQLite atau JSON)](#penyimpanan-data-sqlite-atau-json)
11. [Data Contoh (CONTOH)](#data-contoh-contoh)
12. [Catatan Keamanan](#catatan-keamanan)

---

## Deskripsi Proyek

| Aspek | Keterangan |
| --- | --- |
| Front-end | HTML, CSS, dan JavaScript murni (tanpa framework besar) |
| Back-end | Node.js dengan Express |
| Penyimpanan | SQLite (`node:sqlite` bawaan Node.js, atau `better-sqlite3`), dengan cadangan berkas JSON |
| Desain | *Mobile-first*, palet kuning pisang, krem oat, dan cokelat brownies |
| Bahasa | Seluruh teks menggunakan bahasa Indonesia formal dan netral |

---

## Struktur Folder

```
banafitbrow/
├── server.js                  # Bootstrap server Express
├── package.json               # Dependensi dan skrip npm
├── .env.example               # Contoh berkas konfigurasi lingkungan
├── .gitignore                 # node_modules, .env, berkas database, hasil QR
├── README.md
│
├── config/
│   └── env.js                 # Pembaca berkas .env
│
├── data/
│   ├── produk.js              # SATU berkas konfigurasi data produk (semua data CONTOH)
│   ├── storage.js             # Pemilih lapisan penyimpanan (SQLite → JSON)
│   ├── sqlite-store.js        # Adapter SQLite (node:sqlite / better-sqlite3)
│   ├── json-store.js          # Cadangan penyimpanan berbasis berkas JSON
│   ├── banafitbrow.db         # (dihasilkan) berkas database SQLite
│   └── toko.json              # (dihasilkan) data cadangan bila SQLite tidak tersedia
│
├── routes/
│   ├── api.js                 # API publik: produk, pesanan, feedback
│   ├── admin.js               # API admin: login, status pesanan, rekap, CSV
│   ├── qr.js                  # API pembuat QR Code PNG
│   └── util.js                # Sesi admin, validasi, konversi CSV
│
├── scripts/
│   └── generate-qr.js         # Skrip CLI pembuat QR Code untuk kemasan
│
├── public/                    # Berkas statis yang disajikan ke pengguna
│   ├── index.html             # Beranda
│   ├── produk.html            # Informasi Produk
│   ├── gizi.html              # Komposisi dan Kandungan Gizi
│   ├── pesanan.html           # Pemesanan
│   ├── feedback.html          # Feedback
│   ├── media-sosial.html      # Media Sosial
│   ├── admin.html             # Dashboard Admin (/admin)
│   ├── css/style.css          # Gaya tampilan (mobile-first)
│   ├── js/
│   │   ├── main.js            # Navigasi dan perenderan konfigurasi produk
│   │   ├── gizi.js            # Tabel bahan
│   │   ├── pesanan.js         # Formulir pemesanan
│   │   ├── feedback.js        # Formulir feedback
│   │   └── admin.js           # Dashboard admin
│   └── assets/                # Logo dan ilustrasi (SVG)
│
└── qr/                        # (dihasilkan) hasil QR Code PNG untuk dicetak
```

---

## Prasyarat

- **Node.js versi 18.17 atau lebih baru** (disarankan Node.js 22.5+ agar SQLite bawaan dapat digunakan tanpa kompilasi).
- **npm** (disediakan bersama Node.js).
- Web browser modern pada ponsel atau komputer.

---

## Cara Instalasi

1. Salin (klon atau unduh) proyek ke komputer Anda.
2. Buka terminal pada folder proyek.
3. Pasang dependensi:

   ```bash
   npm install
   ```

4. Salin berkas contoh konfigurasi lingkungan:

   ```bash
   cp .env.example .env
   ```

   Pada Windows (PowerShell):

   ```powershell
   Copy-Item .env.example .env
   ```

5. Edit berkas `.env` (lihat bagian [Mengatur Berkas .env](#mengatur-berkas-env)).

---

## Cara Menjalankan

```bash
npm start
```

Server berjalan di `http://localhost:3000`.

| Alamat | Keterangan |
| --- | --- |
| `http://localhost:3000/` | Beranda konsumen |
| `http://localhost:3000/produk` | Informasi Produk |
| `http://localhost:3000/gizi` | Komposisi dan Kandungan Gizi |
| `http://localhost:3000/pesanan` | Formulir Pemesanan |
| `http://localhost:3000/feedback` | Formulir Feedback |
| `http://localhost:3000/media-sosial` | Media Sosial |
| `http://localhost:3000/admin` | Dashboard Admin |
| `http://localhost:3000/api/qr.png` | QR Code PNG menuju website |

Skrip npm lain:

```bash
npm run dev    # menjalankan server dengan pemuatan ulang otomatis (Node.js >= 18.11)
npm run qr     # membuat qr/banafitbrow-qr.png untuk dicetak pada kemasan
npm run qr -- 1024    # membuat QR Code berukuran 1024 px
```

> **Menguji melalui ponsel pada jaringan yang sama:** cari alamat IP komputer (misalnya `192.168.1.5`), lalu buka `http://192.168.1.5:3000` dari ponsel. Sesuaikan `SITE_URL` pada `.env` dengan alamat tersebut sebelum membuat QR Code uji coba.

---

## Mengatur Berkas .env

Berkas `.env` **tidak** dimasukkan ke repositori (lihat `.gitignore`) dan berisi konfigurasi rahasia.

```env
# Port server (default 3000)
PORT=3000

# Alamat website yang dicetak pada QR Code
SITE_URL=http://localhost:3000

# Kata sandi dashboard admin
ADMIN_PASSWORD=ganti-dengan-kata-sandi-anda

# Nomor WhatsApp pemesanan (format internasional tanpa tanda "+")
WHATSAPP_NOMOR=6281200000000
```

| Kunci | Fungsi | Wajib diisi |
| --- | --- | --- |
| `PORT` | Port server. Bila kosong, digunakan `3000`. | Tidak |
| `SITE_URL` | Alamat tujuan QR Code. Gunakan alamat domain saat publikasi. | Ya |
| `ADMIN_PASSWORD` | Kata sandi login `/admin`. **Ganti dari nilai contoh.** | Ya |
| `WHATSAPP_NOMOR` | Nomor WhatsApp pengganti (opsional, data utama ada di `data/produk.js`). | Tidak |

Jika `ADMIN_PASSWORD` tidak diisi, proses masuk ke dashboard akan ditolak dan server menampilkan pesan pengingat.

Setiap perubahan pada `.env` memerlukan **jalankan ulang server**.

---

## Bagian A — Halaman Konsumen

| Halaman | Isi |
| --- | --- |
| **Beranda** (`/`) | Nama produk, slogan singkat, ringkasan produk, dan tombol menuju bagian lain |
| **Informasi Produk** (`/produk`) | Deskripsi, keunggulan, dan cara penyimpanan |
| **Komposisi dan Gizi** (`/gizi`) | Daftar bahan (pisang, oat, whey protein, dan bahan lain) serta kandungan protein per sajian |
| **Pemesanan** (`/pesanan`) | Formulir nama, nomor WhatsApp, pilihan produk, jumlah, catatan, **kotak persetujuan penggunaan data**, tombol kirim, dan tombol tautan langsung ke WhatsApp |
| **Feedback** (`/feedback`) | Formulir rating 1–5 beserta komentar, ringkasan rata-rata rating, dan daftar feedback terbaru |
| **Media Sosial** (`/media-sosial`) | Tautan Instagram, TikTok, WhatsApp, dan kanal pemesanan lain |

Data formulir pemesanan dan feedback tersimpan pada database melalui API berikut:

| Endpoint | Method | Keterangan |
| --- | --- | --- |
| `/api/produk` | GET | Konfigurasi produk untuk rendering halaman |
| `/api/pesanan` | POST | Menyimpan pesanan baru (validasi di sisi server) |
| `/api/feedback` | GET | Ringkasan dan daftar feedback |
| `/api/feedback` | POST | Menyimpan rating dan komentar |
| `/api/qr.png` | GET | QR Code PNG menuju `SITE_URL` |

---

## Bagian B — Dashboard Admin

Buka `http://localhost:3000/admin` lalu masukkan kata sandi dari berkas `.env`.

Fitur:

- Melindungi halaman dengan kata sandi sederhana dari **`.env`** (bukan ditulis di dalam kode).
- Menampilkan daftar pesanan beserta statusnya (**baru**, **diproses**, **selesai**) beserta kontrol perubahan status.
- Menampilkan daftar feedback dan **rata-rata rating**.
- Menampilkan **data pelanggan** yang dihimpun dari pesanan.
- Menampilkan **rekap penjualan**: total pesanan, total item, total nilai, jumlah per status, dan jumlah per produk.
- Menyediakan **ekspor data pesanan ke CSV** (`/api/admin/pesanan.csv`).
- Menampilkan pratinjau **QR Code** untuk keperluan pencetakan kemasan.

Endpoint admin (memerlukan sesi login):

| Endpoint | Method | Keterangan |
| --- | --- | --- |
| `/api/admin/login` | POST | Memverifikasi kata sandi, menetapkan sesi |
| `/api/admin/logout` | POST | Mengakhiri sesi |
| `/api/admin/sesi` | GET | Pemeriksaan sesi |
| `/api/admin/pesanan` | GET | Daftar seluruh pesanan |
| `/api/admin/pesanan/:id/status` | PUT | Memperbarui status pesanan |
| `/api/admin/pesanan.csv` | GET | Ekspor CSV |
| `/api/admin/feedback` | GET | Feedback dan rata-rata rating |
| `/api/admin/pelanggan` | GET | Data pelanggan terhimpun |
| `/api/admin/rekap` | GET | Rekap penjualan |

---

## Bagian C — Generator QR Code

Terdapat dua cara menghasilkan QR Code PNG:

1. **Melalui skrip** (untuk pencetakan kemasan):

   ```bash
   npm run qr               # 512 px → qr/banafitbrow-qr.png
   npm run qr -- 1024       # 1024 px
   npm run qr -- 512 https://banafitbrow.example.com
   ```

2. **Melalui halaman admin**: buka tab **QR Code** pada `/admin`, lalu unduh PNG berukuran 1024 px.

QR Code dibuat dengan tingkat koreksi galat `H` agar tetap terbaca meskipun kemasan sedikit rusak.

---

## Penyimpanan Data (SQLite atau JSON)

Aplikasi memilih lapisan penyimpanan secara otomatis saat pertama dijalankan:

1. **`node:sqlite`** — modul bawaan Node.js 22.5 ke atas (tanpa kompilasi).
2. **`better-sqlite3`** — dipasang bila diperlukan: `npm install better-sqlite3`.
3. **Berkas JSON** (`data/toko.json`) — cadangan apabila SQLite tidak dapat digunakan di Windows.

Jenis penyimpanan yang aktif ditampilkan pada dashboard admin (label di sebelah judul).

Tabel yang digunakan pada SQLite:

- `pesanan` — id, waktu, nama, whatsapp, produk, harga, jumlah, total, catatan, persetujuan, status.
- `feedback` — id, waktu, nama, rating, komentar.

Berkas database (`data/*.db`) dan data JSON (`data/toko.json`) tidak dimasukkan ke repositori sesuai `.gitignore`.

---

## Data Contoh (CONTOH)

Sesuai ketentuan, **tidak ada angka kandungan gizi, harga, nomor WhatsApp, atau akun media sosial yang dikarang dan dianggap nyata**. Seluruh data tersebut merupakan **data CONTOH** yang ditandai jelas dengan label `CONTOH` pada tampilan maupun di dalam kode.

Semua data dikumpulkan dalam **satu berkas konfigurasi**: [`data/produk.js`](data/produk.js). Ubah data di sana, lalu jalankan ulang server.

Yang perlu diganti sebelum publikasi:

| Data | Lokasi |
| --- | --- |
| Deskripsi, slogan, keunggulan, cara penyimpanan | `data/produk.js` |
| Daftar bahan dan tabel gizi | `data/produk.js` (bagian `bahan`, `gizi`) |
| Varian produk, berat, dan harga | `data/produk.js` (bagian `varian`) |
| Nomor WhatsApp dan akun media sosial | `data/produk.js` (bagian `kontak`, `mediaSosial`) |
| Alamat tujuan QR Code | `SITE_URL` pada `.env` |
| Kata sandi admin | `ADMIN_PASSWORD` pada `.env` |

---

## Catatan Keamanan

- Kata sandi admin hanya dibaca dari `.env`, tidak pernah ditulis di dalam kode sumber.
- Sesi admin menggunakan cookie `HttpOnly` dengan masa berlaku 8 jam.
- Seluruh input divalidasi di sisi server.
- Halaman `/admin` dilindungi kata sandi sederhana; untuk kebutuhan produksi jangka panjang, pertimbangkan penambahan autentikasi yang lebih kuat (HTTPS, pembatasan percobaan masuk, dan penggantian kata sandi berkala).
- Selalu sajikan website melalui **HTTPS** saat dipublikasikan agar data pemesanan terenkripsi dalam perjalanan.
