-- ==========================================
-- SKEMA DATABASE YAYASAN NURUL AITAM KARAWANG
-- ==========================================

CREATE DATABASE IF NOT EXISTS nurulaitam_db;
USE nurulaitam_db;

-- 1. Tabel Admins (Untuk Akun Dashboard Pengurus)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- bcrypt hashed
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Donations (Donasi Online & Offline)
CREATE TABLE IF NOT EXISTS donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE DEFAULT NULL, -- Format: NA-YYYY-XXXX (Dihasilkan saat disetujui)
    donor_name VARCHAR(100) NOT NULL,
    donor_whatsapp VARCHAR(20) NOT NULL,
    donor_email VARCHAR(100) DEFAULT NULL,
    donor_address VARCHAR(255) DEFAULT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    program_name VARCHAR(100) NOT NULL,            -- Cth: Minggu Ceria, Tadabur Alam, Buka Puasa, Lebaran, Umum
    payment_method VARCHAR(50) NOT NULL,           -- Cth: BCA, Mandiri, Tunai, WhatsApp Manual
    receipt_proof VARCHAR(255) DEFAULT NULL,       -- Nama file gambar bukti transfer online
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    donation_type ENUM('ONLINE', 'OFFLINE') NOT NULL,
    message TEXT DEFAULT NULL,                     -- Doa / pesan dari donatur
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL DEFAULT NULL
);

-- 3. Data Admin Awal (Default)
-- Username: admin
-- Password: password123 (Akan di-hash menggunakan bcrypt oleh modul inisialisasi backend)
-- Catatan: Backend akan otomatis mendeteksi jika tabel admins kosong dan memasukkan admin default ini.
