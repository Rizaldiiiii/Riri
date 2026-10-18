Revisi fitur metode penerimaan dan ongkos kirim pada BanaFitBrow. Perubahan utama: pembeli tidak lagi mengisi jarak. Jarak dan ongkos kirim ditentukan oleh admin melalui dashboard. Tidak ada payment gateway dan tidak ada API peta.

Periksa terlebih dahulu implementasi yang sudah ada (tabel tarif di data/produk.js, public/js/ongkir.js, routes/util.js, routes/api.js, penyimpanan SQLite dan JSON, public/pesanan.html, public/js/pesanan.js, public/admin.html, public/js/admin.js), lalu ubah seperlunya dan manfaatkan kembali kode yang sudah ada.

ALUR BARU
1. Pembeli memilih metode penerimaan: "jemput" atau "antar".
2. Metode "jemput": ongkos kirim Rp0 dan alamat kantor ditampilkan, seperti sebelumnya.
3. Metode "antar": pembeli wajib mengisi alamat lengkap (10 sampai 300 karakter) dan boleh mengisi tautan lokasi Google Maps (opsional, maksimal 500 karakter, hanya tautan berawalan http:// atau https://). Kolom jarak dan petunjuk jarak untuk pembeli dihapus.
4. Pesanan "antar" tersimpan dengan status ongkir "menunggu" (belum ditentukan). Rincian biaya pada formulir menampilkan subtotal produk, ongkos kirim "akan dikonfirmasi pengelola", dan total pembayaran dinyatakan sebagai "subtotal ditambah ongkos kirim yang dikonfirmasi pengelola".
5. Admin membuka pesanan "antar" di dashboard, melihat alamat dan tautan lokasi, mengukur jarak melalui Google Maps, lalu memasukkan jarak (km). Sistem menghitung ongkir dengan tabel tarif yang sudah ada dan menyimpannya dengan status "terkonfirmasi". Total pembayaran = subtotal produk + ongkir.
6. Admin menghubungi pembeli melalui WhatsApp untuk mengonfirmasi ongkir dan total pembayaran.

TARIF (sudah ada di konfigurasi; jangan diubah)
- sampai 3 km: Rp6.000; lebih dari 3 sampai 5 km: Rp9.000; lebih dari 5 sampai 10 km: Rp15.000; lebih dari 10 sampai 15 km: Rp22.000; lebih dari 15 sampai 20 km: Rp30.000; lebih dari 20 sampai 30 km: Rp42.000; lebih dari 30 sampai 40 km: Rp55.000; lebih dari 40 km: Rp55.000 ditambah Rp1.500 per kilometer di atas 40 km, dibulatkan ke atas.
- Batas jarak maksimum pada konfigurasi tetap berlaku untuk input admin.

BACK-END
- Endpoint pembuatan pesanan tidak lagi menerima jarak maupun ongkir dari pembeli; abaikan nilai tersebut apabila dikirim. Validasi metode ("jemput" atau "antar"), alamat, dan tautan lokasi (hanya http/https).
- Tambahkan kolom status_ongkir (nilai: tidak_perlu, menunggu, terkonfirmasi) dan lokasi_url pada SQLite maupun penyimpanan JSON, dengan migrasi otomatis yang aman (ALTER TABLE ... ADD COLUMN bila kolom belum ada) dan tanpa menghapus data yang ada.
- Tetapkan status_ongkir untuk data lama berdasarkan isinya: metode jemput menjadi tidak_perlu; metode antar dengan jarak terisi menjadi terkonfirmasi; metode antar tanpa jarak menjadi menunggu.
- Untuk status "menunggu", nilai jarak_km dan ongkir boleh NULL atau 0 sesuai skema yang ada, asalkan tampilan, rekap, dan CSV tidak pernah memperlakukannya sebagai ongkir terkonfirmasi. Jangan membuat ulang tabel bila tidak perlu.
- Tambahkan endpoint khusus admin PUT /api/admin/pesanan/:id/ongkir dengan isi { jarakKm }. Gunakan middleware autentikasi admin yang sudah ada. Endpoint hanya berlaku untuk pesanan berstatus metode "antar", memvalidasi jarak (angka lebih dari 0 dan tidak melebihi batas maksimum), menghitung ongkir di server dengan fungsi tarif yang ada, menyimpan jarak_km, ongkir, dan status_ongkir "terkonfirmasi", lalu mengembalikan data pesanan terbaru beserta total pembayaran. Kembalikan 404 bila pesanan tidak ditemukan dan 400 bila metodenya bukan "antar".
- Ekspor CSV: tambahkan kolom lokasi_url dan status_ongkir; kosongkan jarak_km dan ongkir untuk status "menunggu". Netralkan sel CSV yang berawalan karakter = + - atau @ agar tidak dieksekusi sebagai rumus oleh aplikasi spreadsheet.

FRONT-END PEMESANAN (public/pesanan.html dan public/js/pesanan.js)
- Hapus kolom jarak dan perhitungan ongkir sisi pembeli. Tampilkan kolom alamat dan tautan lokasi hanya untuk metode "antar".
- Sertakan metode, alamat, tautan lokasi (bila ada), subtotal produk, dan keterangan "Ongkos kirim: akan dikonfirmasi pengelola" pada pesan WhatsApp untuk metode "antar".
- Perbarui kalimat persetujuan data agar menyebut alamat dan tautan lokasi.
- Pertahankan label dan teks yang sebelumnya sudah dibersihkan dari kata "CONTOH"; jangan menambahkan kembali.

DASHBOARD ADMIN (public/admin.html dan public/js/admin.js)
- Pada pesanan "antar" berstatus "menunggu", tampilkan penanda "Ongkir menunggu" dan kolom input jarak (km) dengan tombol "Hitung dan Simpan". Tampilkan pratinjau ongkir saat jarak diketik, menggunakan modul tarif yang sama. Setelah disimpan, tampilkan ongkir dan total pembayaran.
- Tampilkan alamat dan tautan lokasi pada informasi tambahan yang ringkas. Tautan lokasi dibuka dengan target="_blank" dan rel="noopener noreferrer", dan hanya dirender bila berawalan http:// atau https://.
- Tambahkan tombol "Konfirmasi via WhatsApp" yang membuka tautan wa.me ke nomor pembeli dengan pesan berisi nama, produk, subtotal, ongkos kirim, dan total pembayaran. Normalisasi nomor (awalan 0 diubah menjadi 62) saat membuat tautan.
- Tambahkan penghitung "Ongkir menunggu konfirmasi" pada statistik di bagian atas dashboard.
- Rekap penjualan: total ongkir hanya menghitung pesanan berstatus terkonfirmasi; tampilkan juga jumlah pesanan yang masih menunggu.
- Pertahankan perilaku yang ada: nomor urut tampilan, pilihan urutan pesanan, dan kolom Status yang dapat diubah langsung serta tetap terlihat tanpa menggulir ke samping pada layar laptop.
- Pesanan lama tetap tampil tanpa galat.

KETENTUAN
- Gunakan bahasa Indonesia yang formal dan netral.
- Jangan mengubah fitur lain. Hapus kode yang tidak lagi terpakai akibat perubahan ini.
- Jangan menjalankan perintah git apa pun (init, add, commit, branch, checkout, push).
- Jangan menghapus, menimpa, atau menambahkan data uji pada berkas data/banafitbrow.db maupun berkas .env. Lakukan pengujian pada salinan basis data sementara, lalu hapus seluruh berkas uji sementara setelah selesai.
- Jelaskan singkat rencana berkas yang akan diubah, lalu langsung kerjakan tanpa menunggu persetujuan.
- Setelah selesai, tampilkan daftar berkas yang diubah, ringkasan perubahannya, dan cara menguji fitur secara manual.