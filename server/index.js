import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'nurulaitam_super_secret_key_123!';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pastikan folder uploads tersedia
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Konfigurasi Multer untuk Unggah Berkas Bukti Transfer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `proof-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Hanya berkas gambar (jpg, jpeg, png, webp) yang diperbolehkan!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // Batas 5MB
});

// Sajikan folder uploads secara statis agar bisa diakses oleh client
app.use('/uploads', express.static(uploadsDir));

// Jalankan file build static jika di mode produksi
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  console.log('📦 Sajikan client static build dari folder /dist.');
}

// ==========================================
// MIDDLEWARE AUTENTIKASI ADMIN
// ==========================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa.' });
    }
    req.admin = user;
    next();
  });
}

// ==========================================
// KODE INVOICE GENERATOR HELPER
// ==========================================
async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const pattern = `NA-${year}-%`;
  
  const rows = await db.query(
    'SELECT MAX(invoice_number) as max_invoice FROM donations WHERE invoice_number LIKE ?',
    [pattern]
  );
  
  let nextNumber = 1;
  const maxInvoice = rows[0]?.max_invoice;
  
  if (maxInvoice) {
    // Format: NA-YYYY-XXXX (contoh: NA-2026-0005)
    const parts = maxInvoice.split('-');
    if (parts.length === 3) {
      const currentNumber = parseInt(parts[2]);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }
  }
  
  // Pad nomor dengan 4 digit nol di depan (misal: 0001, 0012, 0123)
  const paddedNumber = String(nextNumber).padStart(4, '0');
  return `NA-${year}-${paddedNumber}`;
}

// ==========================================
// ROUTE UTAMA / API ENDPOINTS
// ==========================================

// 1. Submit Donasi Online (Public)
app.post('/api/donations', upload.single('receipt'), async (req, res) => {
  try {
    const { donor_name, donor_whatsapp, donor_email, donor_address, amount, program_name, payment_method, message } = req.body;
    
    if (!donor_name || !donor_whatsapp || !amount || !program_name || !payment_method) {
      return res.status(400).json({ message: 'Harap isi semua kolom wajib donasi.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Harap unggah gambar bukti transfer bank Anda.' });
    }

    const filename = req.file.filename;

    const result = await db.query(
      `INSERT INTO donations 
      (donor_name, donor_whatsapp, donor_email, donor_address, amount, program_name, payment_method, receipt_proof, status, donation_type, message) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'ONLINE', ?)`
      ,
      [donor_name, donor_whatsapp, donor_email || null, donor_address || null, parseFloat(amount), program_name, payment_method, filename, message || null]
    );

    res.status(201).json({
      message: 'Donasi berhasil dikirim! Pengurus yayasan akan memverifikasi bukti transfer Anda segera.',
      donationId: result.insertId
    });
  } catch (error) {
    console.error('Error saat submit donasi:', error);
    res.status(500).json({ message: 'Gagal mengirim donasi. Terjadi kesalahan pada server.' });
  }
});

// 2. Ambil Daftar Donasi Terverifikasi (Public - Transparansi)
app.get('/api/donations/public', async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT id, invoice_number, donor_name, donor_address, amount, program_name, payment_method, message, created_at 
       FROM donations 
       WHERE status = 'APPROVED' 
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error saat fetch donasi transparansi:', error);
    res.status(500).json({ message: 'Gagal mengambil data laporan donasi.' });
  }
});

// 3. Ambil Statistik Donasi (Public - Transparansi)
app.get('/api/donations/stats', async (req, res) => {
  try {
    // Total uang terkumpul
    const totalRow = await db.query(
      "SELECT SUM(amount) as total FROM donations WHERE status = 'APPROVED'"
    );
    const totalAmount = parseFloat(totalRow[0]?.total || 0);

    // Total donatur unik
    const countRow = await db.query(
      "SELECT COUNT(DISTINCT donor_name) as count FROM donations WHERE status = 'APPROVED'"
    );
    const totalDonors = countRow[0]?.count || 0;

    // Statistik bulanan untuk grafik (6 bulan terakhir)
    const monthlyRow = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month_key,
        DATE_FORMAT(created_at, '%b %y') as label,
        SUM(amount) as amount
      FROM donations 
      WHERE status = 'APPROVED'
      GROUP BY month_key, label
      ORDER BY month_key ASC
      LIMIT 6
    `);

    res.json({
      totalAmount,
      totalDonors,
      monthlyTrends: monthlyRow
    });
  } catch (error) {
    console.error('Error saat fetch statistik donasi:', error);
    res.status(500).json({ message: 'Gagal mengambil data statistik keuangan.' });
  }
});

// 4. Login Admin (Admin)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi.' });
    }

    const rows = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    const admin = rows[0];

    if (!admin) {
      return res.status(401).json({ message: 'Username atau password admin salah.' });
    }

    const isPasswordValid = bcrypt.compareSync(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password admin salah.' });
    }

    // Buat JWT Token
    const token = jwt.sign(
      { id: admin.id, username: admin.username, name: admin.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login berhasil!',
      token,
      admin: {
        username: admin.username,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Error saat login admin:', error);
    res.status(500).json({ message: 'Terjadi kesalahan sistem saat proses masuk.' });
  }
});

// 4b. Ganti Kata Sandi Admin (Admin - Butuh Token)
app.post('/api/admin/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Kata sandi lama dan kata sandi baru wajib diisi.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Kata sandi baru minimal 6 karakter.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Konfirmasi kata sandi baru tidak cocok.' });
    }

    // Ambil data admin saat ini berdasarkan ID dari token
    const rows = await db.query('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
    const admin = rows[0];

    if (!admin) {
      return res.status(404).json({ message: 'Akun admin tidak ditemukan.' });
    }

    // Verifikasi kata sandi lama
    const isMatch = bcrypt.compareSync(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Kata sandi lama salah.' });
    }

    // Hash kata sandi baru
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    // Update password di database
    await db.query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, req.admin.id]);

    res.json({ message: 'Kata sandi admin berhasil diperbarui!' });
  } catch (error) {
    console.error('Error saat ganti password admin:', error);
    res.status(500).json({ message: 'Gagal memperbarui kata sandi.' });
  }
});

// 5. Ambil Semua Donasi (Admin - Butuh Token)
app.get('/api/admin/donations', authenticateToken, async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM donations ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error saat fetch donasi admin:', error);
    res.status(500).json({ message: 'Gagal mengambil daftar donasi.' });
  }
});

// 6. Entri Donasi Manual / Offline (Admin - Butuh Token)
app.post('/api/admin/donations/offline', authenticateToken, async (req, res) => {
  try {
    const { donor_name, donor_whatsapp, donor_email, donor_address, amount, program_name, payment_method, message } = req.body;

    if (!donor_name || !donor_whatsapp || !amount || !program_name || !payment_method) {
      return res.status(400).json({ message: 'Harap isi semua kolom wajib donasi offline.' });
    }

    // Hasilkan nomor invoice resmi langsung karena status offline langsung APPROVED
    const invoiceNumber = await generateInvoiceNumber();

    const result = await db.query(
      `INSERT INTO donations 
      (invoice_number, donor_name, donor_whatsapp, donor_email, donor_address, amount, program_name, payment_method, status, donation_type, message, verified_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 'OFFLINE', ?, CURRENT_TIMESTAMP)`
      ,
      [invoiceNumber, donor_name, donor_whatsapp, donor_email || null, donor_address || null, parseFloat(amount), program_name, payment_method, message || null]
    );

    res.status(201).json({
      message: 'Donasi offline berhasil dicatat dan kuitansi resmi diterbitkan.',
      donationId: result.insertId,
      invoiceNumber
    });
  } catch (error) {
    console.error('Error saat mencatat donasi offline:', error);
    res.status(500).json({ message: 'Gagal mencatat donasi offline.' });
  }
});

// 7. Verifikasi Donasi Online (Admin - Butuh Token)
app.put('/api/admin/donations/:id/verify', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body; // 'APPROVED' atau 'REJECTED'
    const donationId = req.params.id;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Status verifikasi harus APPROVED atau REJECTED.' });
    }

    // Ambil data donasi
    const rows = await db.query('SELECT * FROM donations WHERE id = ?', [donationId]);
    const donation = rows[0];

    if (!donation) {
      return res.status(404).json({ message: 'Data donasi tidak ditemukan.' });
    }

    if (donation.status !== 'PENDING') {
      return res.status(400).json({ message: 'Donasi ini sudah pernah diproses.' });
    }

    let invoiceNumber = null;
    if (status === 'APPROVED') {
      invoiceNumber = await generateInvoiceNumber();
      
      await db.query(
        'UPDATE donations SET status = ?, invoice_number = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, invoiceNumber, donationId]
      );
    } else {
      await db.query(
        'UPDATE donations SET status = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, donationId]
      );
    }

    res.json({
      message: `Donasi berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}.`,
      invoiceNumber
    });
  } catch (error) {
    console.error('Error saat verifikasi donasi:', error);
    res.status(500).json({ message: 'Gagal melakukan verifikasi donasi.' });
  }
});

// 8. Ambil Detail Donasi Tunggal / Cetak Ulang Kuitansi (Public & Admin)
app.get('/api/donations/:id', async (req, res) => {
  try {
    const donationId = req.params.id;
    const rows = await db.query('SELECT * FROM donations WHERE id = ?', [donationId]);
    const donation = rows[0];

    if (!donation) {
      return res.status(404).json({ message: 'Data donasi tidak ditemukan.' });
    }

    res.json(donation);
  } catch (error) {
    console.error('Error saat fetch detail donasi:', error);
    res.status(500).json({ message: 'Gagal mengambil detail donasi.' });
  }
});

// ==========================================
// CMS API ENDPOINTS (SETTINGS, ARTICLES, GALLERY, PROGRAMS, ACHIEVEMENTS)
// ==========================================

// 9. Settings API (Public & Admin)
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await db.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    rows.forEach(r => {
      settings[r.setting_key] = r.setting_value;
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pengaturan.' });
  }
});

app.post('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, val] of Object.entries(settings)) {
      await db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, val, val]
      );
    }
    res.json({ message: 'Pengaturan berhasil diperbarui.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui data pengaturan.' });
  }
});

// 10. Articles API (Public & Admin)
app.get('/api/articles', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM articles ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data artikel.' });
  }
});

app.post('/api/admin/articles', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, date, category, desc } = req.body;
    if (!title || !category || !desc) {
      return res.status(400).json({ message: 'Judul, kategori, dan isi artikel wajib diisi.' });
    }
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const finalDate = date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    await db.query(
      'INSERT INTO articles (title, date, category, `desc`, image_url) VALUES (?, ?, ?, ?, ?)',
      [title, finalDate, category, desc, imageUrl]
    );
    res.status(201).json({ message: 'Artikel berhasil diterbitkan.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menerbitkan artikel.' });
  }
});

app.delete('/api/admin/articles/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
    res.json({ message: 'Artikel berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus artikel.' });
  }
});

// 11. Gallery API (Public & Admin)
app.get('/api/gallery', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM gallery ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data galeri.' });
  }
});

app.post('/api/admin/gallery', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title || !category) {
      return res.status(400).json({ message: 'Judul dan kategori galeri wajib diisi.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Harap unggah gambar galeri.' });
    }
    const image = `/uploads/${req.file.filename}`;
    await db.query(
      'INSERT INTO gallery (title, category, image) VALUES (?, ?, ?)',
      [title, category, image]
    );
    res.status(201).json({ message: 'Foto galeri berhasil ditambahkan.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan foto galeri.' });
  }
});

app.delete('/api/admin/gallery/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.json({ message: 'Foto galeri berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus foto galeri.' });
  }
});

// 12. Programs API (Public & Admin)
app.get('/api/programs', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM programs ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data program.' });
  }
});

app.post('/api/admin/programs', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, schedule, desc } = req.body;
    if (!title || !schedule || !desc) {
      return res.status(400).json({ message: 'Judul, jadwal, dan deskripsi program wajib diisi.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Harap unggah gambar program.' });
    }
    const image = `/uploads/${req.file.filename}`;
    await db.query(
      'INSERT INTO programs (title, schedule, `desc`, image) VALUES (?, ?, ?, ?)',
      [title, schedule, desc, image]
    );
    res.status(201).json({ message: 'Program asuhan berhasil ditambahkan.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan program asuhan.' });
  }
});

app.delete('/api/admin/programs/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM programs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Program berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus program.' });
  }
});

// 13. Achievements API (Public & Admin)
app.get('/api/achievements', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM achievements ORDER BY year DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data prestasi.' });
  }
});

app.post('/api/admin/achievements', authenticateToken, async (req, res) => {
  try {
    const { year, title, desc } = req.body;
    if (!year || !title || !desc) {
      return res.status(400).json({ message: 'Tahun, judul, dan deskripsi prestasi wajib diisi.' });
    }
    await db.query(
      'INSERT INTO achievements (year, title, `desc`) VALUES (?, ?, ?)',
      [year, title, desc]
    );
    res.status(201).json({ message: 'Catatan prestasi berhasil ditambahkan.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan prestasi.' });
  }
});

app.delete('/api/admin/achievements/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM achievements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Catatan prestasi berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus prestasi.' });
  }
});

// Untuk SPA fallback: sajikan file index.html jika rute tidak dikenal (khusus mode produksi)

if (fs.existsSync(distDir)) {
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Inisialisasi Database dan Jalankan Server
db.initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 SERVER BERJALAN AKTIF DI PORT : ${PORT}`);
      console.log(`📡 URL API: http://localhost:${PORT}/api`);
      console.log(`=================================================`);
    });
  })
  .catch((err) => {
    console.error('❌ Server gagal dinyalakan karena kegagalan database.');
    process.exit(1);
  });
