import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const dbName = process.env.DB_NAME || 'nurulaitam_db';
let pool;

export async function initDatabase() {
  try {
    // 1. Koneksi awal tanpa memilih database untuk memastikan database ada
    const connection = await mysql.createConnection(dbConfig);
    console.log('🔄 Menghubungkan ke MySQL Server...');
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
    console.log(`✅ Database "${dbName}" siap.`);

    // 2. Buat Connection Pool ke database yang dituju
    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 3. Inisialisasi Tabel admins
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabel "admins" siap.');

    // 4. Inisialisasi Tabel donations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS donations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE DEFAULT NULL,
        donor_name VARCHAR(100) NOT NULL,
        donor_whatsapp VARCHAR(20) NOT NULL,
        donor_email VARCHAR(100) DEFAULT NULL,
        donor_address VARCHAR(255) DEFAULT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        program_name VARCHAR(100) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        receipt_proof VARCHAR(255) DEFAULT NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
        donation_type ENUM('ONLINE', 'OFFLINE') NOT NULL,
        message TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP NULL DEFAULT NULL
      );
    `);
    console.log('✅ Tabel "donations" siap.');

    // 4.5. Migrasi: Tambahkan kolom donor_address jika belum ada (penanganan database yang sudah dibuat sebelumnya)
    const [columns] = await pool.query("SHOW COLUMNS FROM donations LIKE 'donor_address'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE donations ADD COLUMN donor_address VARCHAR(255) DEFAULT NULL;");
      console.log('✅ Migrasi Database: Kolom "donor_address" berhasil ditambahkan ke tabel "donations" secara otomatis.');
    }

    // 4.6. Tambah Tabel settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(50) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL
      );
    `);
    console.log('✅ Tabel "settings" siap.');

    // Seed tabel settings jika kosong
    const [settingsCount] = await pool.query('SELECT COUNT(*) as count FROM settings');
    if (settingsCount[0].count === 0) {
      const defaultSettings = [
        ['foundation_name', 'Yayasan Yatim Piatu Nurul Aitam Karawang'],
        ['foundation_address', 'Jl. Raya Proklamasi No. 73 Ds. Karyasari Kec. Rengasdengklok Kab. Karawang'],
        ['chairman_name', 'Dra. Hj. Nina Helmina, M.M'],
        ['founded_year', '1999'],
        ['phone_number', '0812-3456-7890'],
        ['email_address', 'nurulaitamkarawang@gmail.com']
      ];
      for (const [key, val] of defaultSettings) {
        await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, val]);
      }
      console.log('🌱 Seed Data "settings" berhasil dimasukkan.');
    }

    // 4.7. Tambah Tabel articles
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        \`desc\` TEXT NOT NULL,
        image_url VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabel "articles" siap.');

    // Seed tabel articles jika kosong
    const [articlesCount] = await pool.query('SELECT COUNT(*) as count FROM articles');
    if (articlesCount[0].count === 0) {
      const defaultArticles = [
        [
          'Keutamaan Menyantuni Anak Yatim: Mengalirkan Keberkahan di Dunia & Akhirat',
          '12 Mei 2026',
          'Edukasi Sosial',
          'Dalam ajaran Islam, memelihara dan menyantuni anak yatim adalah amalan yang sangat mulia. Rasulullah SAW menggambarkan kedekatan beliau dengan pengasuh anak yatim di surga laksana jari telunjuk dan jari tengah. Mari kita kaji bersama faedah besar di baliknya...'
        ],
        [
          'Keseruan Tadabur Alam Ke Wisata Edukasi Karawang: Membahagiakan Anak Yatim',
          '28 April 2026',
          'Kegiatan Yayasan',
          'Keceriaan terpancar dari wajah puluhan anak asuh Yayasan Nurul Aitam Karawang saat mengunjungi wisata edukasi alam terbuka. Kegiatan Tadabur Alam semester ini tidak hanya sekadar rekreasi, namun diisi dengan pembelajaran pengenalan flora, pembiasaan zikir pagi, dan permainan kemandirian...'
        ],
        [
          'Transparansi Dana: Kunci Utama Membangun Kepercayaan Umat & Donatur',
          '05 April 2026',
          'Artikel Opini',
          'Kepercayaan publik adalah aset terbesar bagi lembaga filantropi dan panti asuhan. Melalui sistem pelaporan mutasi donasi real-time yang dapat diakses secara terbuka di website, Yayasan Nurul Aitam membuktikan dedikasinya untuk terus menjaga amanah secara profesional dan akuntabel...'
        ]
      ];
      for (const [title, date, cat, desc] of defaultArticles) {
        await pool.query('INSERT INTO articles (title, date, category, \`desc\`) VALUES (?, ?, ?, ?)', [title, date, cat, desc]);
      }
      console.log('🌱 Seed Data "articles" berhasil dimasukkan.');
    }

    // 4.8. Tambah Tabel gallery
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabel "gallery" siap.');

    // Seed tabel gallery jika kosong
    const [galleryCount] = await pool.query('SELECT COUNT(*) as count FROM gallery');
    if (galleryCount[0].count === 0) {
      const defaultGallery = [
        ['Belajar Bersama di Pendopo', 'Minggu Ceria', 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop'],
        ['Tadabur Alam Kunjungan Kebun Raya', 'Tadabur Alam', 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop'],
        ['Santunan Bulanan & Fun Games', 'Minggu Ceria', 'https://images.unsplash.com/photo-1540479859555-17af45c78602?q=80&w=800&auto=format&fit=crop'],
        ['Buka Puasa Bersama Donatur Karawang', 'Ramadhan', 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?q=80&w=800&auto=format&fit=crop'],
        ['Senyum Ceria Pembagian Baju Lebaran', 'Lebaran Yatim', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop'],
        ['Outbound Outing Class Hutan Pinus', 'Tadabur Alam', 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=800&auto=format&fit=crop']
      ];
      for (const [title, cat, img] of defaultGallery) {
        await pool.query('INSERT INTO gallery (title, category, image) VALUES (?, ?, ?)', [title, cat, img]);
      }
      console.log('🌱 Seed Data "gallery" berhasil dimasukkan.');
    }

    // 4.9. Tambah Tabel programs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS programs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        schedule VARCHAR(100) NOT NULL,
        \`desc\` TEXT NOT NULL,
        image VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabel "programs" siap.');

    // Seed tabel programs jika kosong
    const [programsCount] = await pool.query('SELECT COUNT(*) as count FROM programs');
    if (programsCount[0].count === 0) {
      const defaultPrograms = [
        [
          'Minggu Ceria Bersama Yatim',
          'Setiap Hari Minggu',
          'Dilaksanakan setiap hari Minggu di lingkungan yayasan, diisi dengan kegiatan pembelajaran, pengembangan kemandirian anak-anak yatim, santunan, serta hiburan (fun games) yang edukatif.',
          'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop'
        ],
        [
          'Tadabur Alam',
          'Berkala (Semesteran)',
          'Kegiatan luar ruangan untuk membahagiakan anak-anak yatim dengan mengajak rekreasi ke tempat-tempat wisata alam atau wisata edukasi guna meningkatkan kecintaan pada alam dan sang Pencipta.',
          'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=800&auto=format&fit=crop'
        ],
        [
          'Buka Puasa Bersama Yatim',
          'Bulan Ramadhan',
          'Menghadirkan kehangatan dan kebersamaan di bulan suci Ramadhan melalui buka puasa bersama, diiringi kajian keagamaan, doa bersama, dan penyaluran paket santunan Lebaran.',
          'https://images.unsplash.com/photo-1576085898323-218337e3e43c?q=80&w=800&auto=format&fit=crop'
        ],
        [
          'Lebaran untuk Yatim',
          'Menjelang Idul Fitri',
          'Program khusus penyediaan pakaian baru, bingkisan lebaran, dan uang saku santunan agar anak-anak yatim dapat merasakan sukacita dan kebahagiaan hari raya sebagaimana anak-anak lainnya.',
          'https://images.unsplash.com/photo-1518398046500-7c3a1dca8fe9?q=80&w=800&auto=format&fit=crop'
        ]
      ];
      for (const [title, sched, desc, img] of defaultPrograms) {
        await pool.query('INSERT INTO programs (title, schedule, \`desc\`, image) VALUES (?, ?, ?, ?)', [title, sched, desc, img]);
      }
      console.log('🌱 Seed Data "programs" berhasil dimasukkan.');
    }

    // 4.10. Tambah Tabel achievements
    await pool.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        year VARCHAR(10) NOT NULL,
        title VARCHAR(255) NOT NULL,
        \`desc\` TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabel "achievements" siap.');

    // Seed tabel achievements jika kosong
    const [achievementsCount] = await pool.query('SELECT COUNT(*) as count FROM achievements');
    if (achievementsCount[0].count === 0) {
      const defaultAchievements = [
        ['2006', 'Yayasan Terbaik se-Jawa Barat', 'Diberikan oleh Gubernur Jawa Barat atas dedikasi dan kualitas tata kelola asuhan anak yatim terbaik tingkat provinsi.'],
        ['2015', 'LKS LKSA Berprestasi Kabupaten Karawang', 'Penghargaan dari Dinas Sosial Karawang sebagai Lembaga Kesejahteraan Sosial Anak teraktif dan paling tertib administrasi.'],
        ['2021', 'Sertifikasi Akreditasi A dari KEMENSOS RI', 'Memperoleh predikat kelayakan asuhan tertinggi secara nasional oleh Badan Akreditasi Lembaga Kesejahteraan Sosial Kemensos RI.']
      ];
      for (const [yr, title, desc] of defaultAchievements) {
        await pool.query('INSERT INTO achievements (year, title, \`desc\`) VALUES (?, ?, ?)', [yr, title, desc]);
      }
      console.log('🌱 Seed Data "achievements" berhasil dimasukkan.');
    }

    // 5. Cek dan Masukkan Admin Default jika belum ada admin sama sekali
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM admins');
    if (rows[0].count === 0) {
      const username = 'admin';
      const passwordPlain = 'password123';
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(passwordPlain, salt);
      const name = 'Pengurus Yayasan';
      
      await pool.query(
        'INSERT INTO admins (username, password, name) VALUES (?, ?, ?)',
        [username, hashedPassword, name]
      );
      console.log('=================================================');
      console.log('⚠️ AKUN ADMIN DEFAULT TELAH DIBUAT!');
      console.log(`   Username : ${username}`);
      console.log(`   Password : ${passwordPlain}`);
      console.log('   Silakan gunakan akun ini untuk masuk ke Dashboard.');
      console.log('=================================================');
    }

    return pool;
  } catch (error) {
    console.error('❌ Gagal menginisialisasi database MySQL:', error.message);
    console.error('💡 Pastikan MySQL Server Anda aktif dan kredensial di file .env sudah benar.');
    throw error;
  }
}

// Helper untuk menjalankan query SQL
export async function query(sql, params) {
  if (!pool) {
    throw new Error('Database pool belum diinisialisasi. Hubungi initDatabase() terlebih dahulu.');
  }
  const [results] = await pool.query(sql, params);
  return results;
}

export default {
  initDatabase,
  query,
  getPool: () => pool
};
