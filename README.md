# 💚 Website & Sistem Donasi Premium Yayasan Nurul Aitam Karawang

Aplikasi Sistem Informasi Terintegrasi dan Layanan Penggalangan Dana Donasi Online/Offline untuk **Yayasan Yatim Piatu Nurul Aitam Karawang** (berdiri sejak 1999). 

Dibangun dengan arsitektur modern **Full-Stack (React + Node.js/Express + MySQL)** yang dirancang khusus agar sangat amanah, akuntabel, dan **siap dideploy secara mudah ke VPS (Virtual Private Server)**.

---

## ✨ Fitur Utama & Keunggulan Premium

1. **Desain Visual Kelas Dunia**: Menggunakan palet warna *Deep Emerald Green* (melambangkan ketulusan & keislaman) dan aksen *Warm Gold* (melambangkan premium & harapan), dengan sentuhan *glassmorphism* modern dan responsif.
2. **Formulir Donasi Multi-Step**: Alur pengisian donasi interaktif 4-tahap (Data Donatur -> Nominal Cepat -> Metode Bank Transfer & Upload Bukti -> Konfirmasi Sukses).
3. **Laporan Transparansi Keuangan Real-Time**: Visualisasi data finansial real-time menggunakan grafik batang SVG interaktif dan tabel mutasi donasi yang bisa dicari/disaring secara dinamis.
4. **Penerbitan Kuitansi Resmi PDF Instan**: Desain kuitansi ukuran A4 profesional lengkap dengan Kop Surat Resmi Yayasan, stempel digital, tanda tangan Ketua Yayasan **Dra. Hj. Nina Helmina, M.M**, QR Code verifikasi, nomor registrasi unik (*invoice number*), dan kalkulator Terbilang rupiah otomatis (misal: Rp 500.000 menjadi *"Lima Ratus Ribu Rupiah"*). Dapat langsung diunduh PDF sekali klik.
5. **Dashboard Kontrol Admin Canggih**:
   - **Widget Ringkasan**: Statistik nominal approved, pending, donatur aktif.
   - **Antrean Verifikasi**: Menampilkan detail donasi online pending dengan tombol pratinjau bukti transfer gambar (lightbox) -> Klik **Approve** otomatis menerbitkan kuitansi resmi, mengirim data ke ledger, dan merilisnya ke transparansi publik.
   - **Entri Donasi Offline (Manual)**: Mencatat donasi tunai, titipan WhatsApp, kotak amal secara langsung. Sekali simpan, kuitansi PDF resmi langsung terunduh otomatis.
   - **Buku Kas Ledger**: Pencarian dan arsip seluruh mutasi keuangan lengkap.

---

## 🛠️ Persyaratan Sistem

- **Node.js** (versi >= 16.x)
- **NPM** (versi >= 8.x)
- **MySQL Server** (XAMPP / Laragon / MySQL Standalone)

---

## 💻 Panduan Menjalankan Secara Lokal (Development)

Proyek ini telah dikonfigurasi menggunakan skrip **Concurrently** monorepo sehingga Anda **hanya perlu menjalankan satu perintah** untuk memulai server backend API sekaligus server frontend React!

### Langkah 1: Kloning & Install Dependensi
Buka terminal Anda di folder proyek `nurulaitam` lalu jalankan perintah:
```bash
npm install
```

### Langkah 2: Setup Database MySQL
1. Pastikan layanan MySQL Anda sudah aktif (misalnya melalui panel XAMPP atau Laragon).
2. Buat database kosong bernama `nurulaitam_db` (Anda bisa membuatnya via phpMyAdmin atau MySQL CLI).
   ```sql
   CREATE DATABASE nurulaitam_db;
   ```
   *(Catatan: Anda tidak perlu mengimpor berkas SQL secara manual. Server Express kami memiliki modul inisialisasi cerdas yang akan otomatis membuat tabel-tabel dan data admin pertama kali saat server dinyalakan).*

### Langkah 3: Konfigurasi Lingkungan (`.env`)
Sesuaikan file konfigurasi `.env` yang berada di direktori akar proyek dengan kredensial database Anda:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=nurulaitam_db
JWT_SECRET=nurulaitam_super_secret_key_123!
```

### Langkah 4: Jalankan Aplikasi!
Di terminal direktori akar proyek, jalankan skrip berikut:
```bash
npm run dev
```
Perintah ini otomatis menyalakan:
1. **Server API Express** di `http://localhost:5000/api`
2. **Klien Frontend React** di `http://localhost:5173`

Buka browser Anda dan akses `http://localhost:5173`. Aplikasi kini terhubung langsung dengan database MySQL lokal Anda!

---

## 🔐 Kredensial Login Admin Default

Setelah server berhasil dijalankan pertama kali, sistem database otomatis mendaftarkan akun pengurus awal:
- **URL Login Staf**: Klik tautan *"Login Staf"* di pojok kanan bawah footer website publik.
- **Username**: `admin`
- **Password**: `password123`

*(Sangat disarankan untuk mengubah kata sandi ini langsung di tabel `admins` MySQL setelah berhasil masuk).*

---

## 🚀 Panduan Deployment Ke VPS (Production)

Sistem ini sangat efisien untuk di-deploy ke VPS karena **Frontend React statis akan disajikan langsung oleh server Express backend**. Ini berarti Anda hanya perlu mengelola **satu proses Node.js** di VPS Anda!

### Langkah 1: Build Frontend React
Di server lokal atau VPS, jalankan perintah build untuk mengompilasi file static HTML/JS/CSS:
```bash
npm run build
```
Perintah ini akan menghasilkan direktori `/dist` di folder akar proyek Anda.

### Langkah 2: Konfigurasi Environment VPS
Buat file `.env` di VPS Anda dan sesuaikan dengan kredensial database MySQL VPS Anda (misal port 3306 atau database cloud Anda). Pastikan `JWT_SECRET` diganti dengan string acak yang aman.

### Langkah 3: Jalankan Menggunakan PM2 (Process Manager)
Untuk memastikan server backend terus berjalan di latar belakang VPS dan otomatis menyala kembali jika VPS restart, gunakan **PM2**:

1. Install PM2 secara global di VPS (jika belum ada):
   ```bash
   npm install -g pm2
   ```
2. Jalankan server Express menggunakan PM2:
   ```bash
   pm2 start server/index.js --name "nurul-aitam-app"
   ```
3. Simpan konfigurasi startup PM2:
   ```bash
   pm2 save
   pm2 startup
   ```

### Langkah 4: Hubungkan ke Nginx / Apache
Server Express berjalan pada port `5000` (atau port lain sesuai set di `.env`). Untuk mengarahkan domain utama Anda (misalnya `https://nurulaitam-karawang.or.id`) ke aplikasi ini, konfigurasikan reverse proxy di **Nginx**:

```nginx
server {
    listen 80;
    server_name nurulaitam-karawang.or.id www.nurulaitam-karawang.or.id;

    location / {
        proxy_pass http://127.0.0.1:5000; # Mengarahkan ke port Express
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aplikasi Yayasan Nurul Aitam Karawang Anda sekarang telah aktif, aman, berkinerja tinggi, dan siap menerima donasi dari seluruh penjuru dunia di VPS Anda!
