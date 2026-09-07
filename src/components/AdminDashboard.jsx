import React, { useState, useEffect } from 'react';
import { Layout, DollarSign, Users, Award, FileText, CheckCircle, XCircle, PlusCircle, Search, Download, LogOut, Upload, User, Phone, Mail, Image as ImageIcon, Printer, Lock, Menu, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import ReceiptPDF from './ReceiptPDF';

export default function AdminDashboard({ adminSession, onLogout, navigateTo }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State Input Offline Form
  const [offlineForm, setOfflineForm] = useState({
    donor_name: '',
    donor_whatsapp: '',
    donor_email: '',
    donor_address: '',
    amount: '',
    program_name: 'Minggu Ceria Bersama Yatim',
    payment_method: 'Tunai',
    message: ''
  });
  const [offlineSuccessMsg, setOfflineSuccessMsg] = useState('');
  
  // State Search & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // CMS States
  const [articlesList, setArticlesList] = useState([]);
  const [galleryList, setGalleryList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [achievementsList, setAchievementsList] = useState([]);
  const [settingsForm, setSettingsForm] = useState({
    foundation_name: '',
    foundation_address: '',
    chairman_name: '',
    founded_year: '',
    phone_number: '',
    email_address: ''
  });

  // CMS Form States
  const [articleForm, setArticleForm] = useState({ title: '', category: 'Edukasi Sosial', desc: '' });
  const [articleFile, setArticleFile] = useState(null);
  const [galleryForm, setGalleryForm] = useState({ title: '', category: 'Minggu Ceria' });
  const [galleryFile, setGalleryFile] = useState(null);
  const [programForm, setProgramForm] = useState({ title: '', schedule: '', desc: '' });
  const [programFile, setProgramFile] = useState(null);
  const [achievementForm, setAchievementForm] = useState({ year: '', title: '', desc: '' });

  // Password Change States
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });

  // Admin Management States
  const [adminsList, setAdminsList] = useState([]);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', username: '', password: '' });
  const [adminAddLoading, setAdminAddLoading] = useState(false);
  const [adminAddStatus, setAdminAddStatus] = useState({ type: '', message: '' });

  // Fetch seluruh data donasi untuk admin (termasuk pending & offline)
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/donations', {
        headers: {
          'Authorization': `Bearer ${adminSession.token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal mengambil data.');
      setDonations(data);
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCMSData = async () => {
    try {
      const [resSettings, resArticles, resGallery, resPrograms, resAchievements] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/articles'),
        fetch('/api/gallery'),
        fetch('/api/programs'),
        fetch('/api/achievements')
      ]);

      if (resSettings.ok) {
        const data = await resSettings.json();
        setSettingsForm({
          foundation_name: data.foundation_name || '',
          foundation_address: data.foundation_address || '',
          chairman_name: data.chairman_name || '',
          founded_year: data.founded_year || '',
          phone_number: data.phone_number || '',
          email_address: data.email_address || ''
        });
      }
      if (resArticles.ok) setArticlesList(await resArticles.json());
      if (resGallery.ok) setGalleryList(await resGallery.json());
      if (resPrograms.ok) setProgramsList(await resPrograms.json());
      if (resAchievements.ok) setAchievementsList(await resAchievements.json());
    } catch (err) {
      console.error("Gagal memuat data CMS:", err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/admins', {
        headers: { 'Authorization': `Bearer ${adminSession.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminsList(data);
      }
    } catch (err) {
      console.error("Gagal memuat data pengurus:", err);
    }
  };

  useEffect(() => {
    if (adminSession?.token) {
      fetchAdminData();
      fetchCMSData();
      fetchAdmins();
    }
  }, [adminSession]);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCompactDate = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const date = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${date} ${month} ${year}, ${hours}:${minutes}`;
  };

  // 1. Verifikasi (Setujui / Tolak) Donasi Online
  const handleVerifyDonation = async (id, status) => {
    if (!window.confirm(`Apakah Anda yakin ingin ${status === 'APPROVED' ? 'MENYETUJUI' : 'MENOLAK'} donasi ini?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/donations/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession.token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      alert(`Donasi berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}!`);
      
      // Jika disetujui, tawarkan download kuitansi langsung
      if (status === 'APPROVED') {
        const approvedDonation = donations.find(d => d.id === id);
        if (approvedDonation) {
          handleDownloadPDF({
            ...approvedDonation,
            status: 'APPROVED',
            invoice_number: data.invoiceNumber,
            verified_at: new Date().toISOString()
          });
        }
      }
      
      fetchAdminData(); // Refresh data
    } catch (err) {
      alert(err.message || 'Gagal memverifikasi donasi.');
    }
  };

  // 2. Entri Donasi Manual / Offline
  const handleAddOffline = async (e) => {
    e.preventDefault();
    setOfflineSuccessMsg('');
    setErrorMessage('');

    if (!offlineForm.donor_name || !offlineForm.donor_whatsapp || !offlineForm.amount) {
      setErrorMessage('Harap isi semua kolom wajib donasi offline.');
      return;
    }

    try {
      const response = await fetch('/api/admin/donations/offline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession.token}`
        },
        body: JSON.stringify({
          ...offlineForm,
          amount: parseFloat(offlineForm.amount)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setOfflineSuccessMsg(`Donasi offline dari ${offlineForm.donor_name} senilai Rp ${parseFloat(offlineForm.amount).toLocaleString('id-ID')} berhasil dicatat!`);
      
      // Download Kuitansi Otomatis untuk Donatur Offline
      handleDownloadPDF({
        id: data.donationId,
        invoice_number: data.invoiceNumber,
        donor_name: offlineForm.donor_name,
        donor_whatsapp: offlineForm.donor_whatsapp,
        donor_email: offlineForm.donor_email,
        donor_address: offlineForm.donor_address,
        amount: parseFloat(offlineForm.amount),
        program_name: offlineForm.program_name,
        payment_method: offlineForm.payment_method,
        status: 'APPROVED',
        donation_type: 'OFFLINE',
        message: offlineForm.message,
        created_at: new Date().toISOString(),
        verified_at: new Date().toISOString()
      });

      // Reset Form
      setOfflineForm({
        donor_name: '',
        donor_whatsapp: '',
        donor_email: '',
        donor_address: '',
        amount: '',
        program_name: 'Minggu Ceria Bersama Yatim',
        payment_method: 'Tunai',
        message: ''
      });

      fetchAdminData(); // Refresh data
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyimpan donasi offline.');
    }
  };

  // CMS CRUD HANDLERS

  // 1. Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession.token}`
        },
        body: JSON.stringify(settingsForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Pengaturan Informasi Yayasan berhasil disimpan!');
      fetchCMSData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan pengaturan.');
    }
  };

  // 1b. Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', message: '' });

    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession.token}`
        },
        body: JSON.stringify(passwordForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah kata sandi.');

      setPasswordStatus({ type: 'success', message: 'Kata sandi admin berhasil diperbarui!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  // 1c. Kelola Pengurus
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminAddStatus({ type: '', message: '' });

    if (!newAdminForm.name || !newAdminForm.username || !newAdminForm.password) {
      setAdminAddStatus({ type: 'error', message: 'Semua kolom wajib diisi.' });
      return;
    }

    if (newAdminForm.password.length < 6) {
      setAdminAddStatus({ type: 'error', message: 'Password minimal 6 karakter.' });
      return;
    }

    setAdminAddLoading(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession.token}`
        },
        body: JSON.stringify(newAdminForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menambahkan akun pengurus.');

      setAdminAddStatus({ type: 'success', message: 'Akun pengurus berhasil ditambahkan!' });
      setNewAdminForm({ name: '', username: '', password: '' });
      fetchAdmins();
    } catch (err) {
      setAdminAddStatus({ type: 'error', message: err.message });
    } finally {
      setAdminAddLoading(false);
    }
  };

  const handleDeleteAdmin = async (id, username) => {
    if (!window.confirm(`Yakin ingin menghapus akun pengurus "${username}"?`)) return;

    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminSession.token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus pengurus.');

      alert('Akun pengurus berhasil dihapus.');
      fetchAdmins();
    } catch (err) {
      alert(err.message);
    }
  };

  // 2. Articles
  const handleAddArticle = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!articleForm.title || !articleForm.desc) {
      alert('Judul dan deskripsi artikel wajib diisi.');
      return;
    }
    const formData = new FormData();
    formData.append('title', articleForm.title);
    formData.append('category', articleForm.category);
    formData.append('desc', articleForm.desc);
    if (articleFile) {
      formData.append('image', articleFile);
    }

    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSession.token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Artikel berhasil diterbitkan!');
      setArticleForm({ title: '', category: 'Edukasi Sosial', desc: '' });
      setArticleFile(null);
      fetchCMSData();
    } catch (err) {
      alert(err.message || 'Gagal menerbitkan artikel.');
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminSession.token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Artikel berhasil dihapus!');
      fetchCMSData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus artikel.');
    }
  };

  // 3. Gallery
  const handleAddGallery = async (e) => {
    e.preventDefault();
    if (!galleryForm.title || !galleryFile) {
      alert('Judul dan unggahan foto wajib diisi.');
      return;
    }
    const formData = new FormData();
    formData.append('title', galleryForm.title);
    formData.append('category', galleryForm.category);
    formData.append('image', galleryFile);

    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSession.token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Foto galeri berhasil ditambahkan!');
      setGalleryForm({ title: '', category: 'Minggu Ceria' });
      setGalleryFile(null);
      fetchCMSData();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan foto.');
    }
  };

  const handleDeleteGallery = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus foto galeri ini?')) return;
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminSession.token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Foto galeri berhasil dihapus!');
      fetchCMSData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus foto.');
    }
  };

  // 4. Programs & Achievements
  const handleAddProgram = async (e) => {
    e.preventDefault();
    if (!programForm.title || !programForm.schedule || !programForm.desc || !programFile) {
      alert('Semua isian program dan gambar wajib dilengkapi.');
      return;
    }
    const formData = new FormData();
    formData.append('title', programForm.title);
    formData.append('schedule', programForm.schedule);
    formData.append('desc', programForm.desc);
    formData.append('image', programFile);

    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSession.token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Program asuhan berhasil ditambahkan!');
      setProgramForm({ title: '', schedule: '', desc: '' });
      setProgramFile(null);
      fetchCMSData();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan program.');
    }
  };

  const handleDeleteProgram = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus program ini?')) return;
    try {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminSession.token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Program berhasil dihapus!');
      fetchCMSData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus program.');
    }
  };

  const handleAddAchievement = async (e) => {
    e.preventDefault();
    if (!achievementForm.year || !achievementForm.title || !achievementForm.desc) {
      alert('Semua isian prestasi wajib dilengkapi.');
      return;
    }
    try {
      const res = await fetch('/api/admin/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession.token}`
        },
        body: JSON.stringify(achievementForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Catatan prestasi berhasil ditambahkan!');
      setAchievementForm({ year: '', title: '', desc: '' });
      fetchCMSData();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan prestasi.');
    }
  };

  const handleDeleteAchievement = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan prestasi ini?')) return;
    try {
      const res = await fetch(`/api/admin/achievements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminSession.token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Catatan prestasi berhasil dihapus!');
      fetchCMSData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus prestasi.');
    }
  };

  // Failsafe Print/PDF Fallback Window (Berjalan lancar secara offline dengan gaya desain identik)
  const triggerPrintFallback = (element, donation) => {
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) {
      // Jika pop-up diblokir browser, jalankan cetak halaman langsung
      window.print();
      setActiveReceipt(null);
      return;
    }
    
    // Salin seluruh stylesheet CSS aktif dari halaman utama agar desain tetap serasi di jendela cetak
    let stylesHtml = '';
    for (const node of document.querySelectorAll('link[rel="stylesheet"], style')) {
      stylesHtml += node.outerHTML;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Kuitansi_${donation.invoice_number || 'Donasi'}</title>
          ${stylesHtml}
          <style>
            body { 
              background: white; 
              padding: 40px; 
              margin: 0;
            }
            .receipt-wrapper { 
              border: none !important; 
              box-shadow: none !important; 
              max-width: 100% !important; 
              width: 100% !important; 
              margin: 0 !important; 
              padding: 0 !important;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-only-container">
            ${element.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setActiveReceipt(null);
  };

  // 3. Download Kuitansi PDF menggunakan html2pdf.js secara langsung
  const handleDownloadPDF = (donation) => {
    setActiveReceipt(donation);
    setTimeout(() => {
      const element = document.getElementById('admin-receipt-print-node');
      if (!element) {
        alert('Gagal me-render template kuitansi.');
        return;
      }
      
      // Deteksi apakah berkas pustaka html2pdf.js telah berhasil termuat dari CDN
      if (typeof window.html2pdf === 'function') {
        const opt = {
          margin:       [10, 10, 10, 10],
          filename:     `Kuitansi_${donation.invoice_number || 'Donasi'}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        window.html2pdf().from(element).set(opt).save()
          .then(() => {
            setActiveReceipt(null); // Bersihkan status aktif
          })
          .catch(err => {
            console.error('html2pdf error:', err);
            alert('Gagal mengunduh PDF secara langsung: ' + (err.message || err));
            setActiveReceipt(null);
          });
      } else {
        console.warn('html2pdf.js CDN tidak terjangkau (Offline / Terblokir).');
        alert('Gagal mengunduh PDF secara langsung. Mesin PDF belum siap atau koneksi internet terganggu. Silakan gunakan opsi "Cetak" sebagai cadangan.');
        setActiveReceipt(null);
      }
    }, 500);
  };

  // 3b. Cetak Kuitansi langsung menggunakan Failsafe Jendela Cetak Browser
  const handlePrintPDF = (donation) => {
    setActiveReceipt(donation);
    setTimeout(() => {
      const element = document.getElementById('admin-receipt-print-node');
      if (!element) {
        alert('Gagal me-render template kuitansi.');
        return;
      }
      triggerPrintFallback(element, donation);
    }, 500);
  };

  // Hitung Agregat Dashboard
  const approvedDonations = donations.filter(d => d.status === 'APPROVED');
  const pendingDonations = donations.filter(d => d.status === 'PENDING');
  
  const totalFinancial = approvedDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const totalPendingFinancial = pendingDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const uniqueDonorsCount = new Set(approvedDonations.map(d => d.donor_name)).size;

  // Filter pencarian tabel Ledger
  const filteredLedger = donations.filter(item => {
    const searchStr = searchQuery.toLowerCase();
    return (
      item.donor_name.toLowerCase().includes(searchStr) ||
      (item.invoice_number && item.invoice_number.toLowerCase().includes(searchStr)) ||
      item.program_name.toLowerCase().includes(searchStr) ||
      item.payment_method.toLowerCase().includes(searchStr)
    );
  });

  return (
    <div className="admin-layout">
      {/* SIDEBAR NAV (Collapsible) */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-group">
            <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="sidebar-title">
              Nurul Aitam
              <span style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: 'var(--color-gold-400)' }}>DASHBOARD CONTROL</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={toggleSidebar} 
            className="sidebar-collapse-toggle sidebar-collapse-toggle-desktop"
            title={sidebarCollapsed ? "Buka Sidebar Penuh" : "Sembunyikan Sidebar (Sisakan Icon)"}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-welcome">Sesi Aktif</div>
          <div className="user-name">{adminSession?.name || 'Admin Pengurus'}</div>
        </div>

        <nav style={{ flexGrow: 1 }}>
          <ul className="sidebar-menu">
            <li>
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                title="Ringkasan Analitik"
              >
                <Layout size={18} />
                <span className="sidebar-btn-text">Ringkasan Analitik</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('pending')} 
                className={`sidebar-btn ${activeTab === 'pending' ? 'active' : ''}`}
                title="Antrean Verifikasi"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <CheckCircle size={18} />
                  <span className="sidebar-btn-text">Antrean Verifikasi</span>
                </div>
                {pendingDonations.length > 0 && (
                  <>
                    <span className="sidebar-badge-count">
                      {pendingDonations.length}
                    </span>
                    <span className="sidebar-pending-dot" title={`${pendingDonations.length} verifikasi pending`} />
                  </>
                )}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('offline')} 
                className={`sidebar-btn ${activeTab === 'offline' ? 'active' : ''}`}
                title="Input Donasi Offline"
              >
                <PlusCircle size={18} />
                <span className="sidebar-btn-text">Input Donasi Offline</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('ledger')} 
                className={`sidebar-btn ${activeTab === 'ledger' ? 'active' : ''}`}
                title="Buku Kas Ledger"
              >
                <FileText size={18} />
                <span className="sidebar-btn-text">Buku Kas Ledger</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('articles')} 
                className={`sidebar-btn ${activeTab === 'articles' ? 'active' : ''}`}
                title="Kelola Artikel"
              >
                <FileText size={18} />
                <span className="sidebar-btn-text">Kelola Artikel</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('gallery')} 
                className={`sidebar-btn ${activeTab === 'gallery' ? 'active' : ''}`}
                title="Kelola Galeri"
              >
                <ImageIcon size={18} />
                <span className="sidebar-btn-text">Kelola Galeri</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('programs')} 
                className={`sidebar-btn ${activeTab === 'programs' ? 'active' : ''}`}
                title="Kelola Program & Prestasi"
              >
                <Award size={18} />
                <span className="sidebar-btn-text">Kelola Program & Prestasi</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('admins')} 
                className={`sidebar-btn ${activeTab === 'admins' ? 'active' : ''}`}
                title="Kelola Pengurus"
              >
                <Users size={18} />
                <span className="sidebar-btn-text">Kelola Pengurus</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`}
                title="Pengaturan Yayasan"
              >
                <Layout size={18} />
                <span className="sidebar-btn-text">Pengaturan Yayasan</span>
              </button>
            </li>
          </ul>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button 
            onClick={() => navigateTo('home')} 
            className="sidebar-btn" 
            style={{ color: 'rgba(255,255,255,0.6)' }}
            title="Kembali ke Website Utama"
          >
            <ArrowLeft size={18} />
            <span className="sidebar-btn-text">Kembali ke Website</span>
          </button>
          <button 
            onClick={onLogout} 
            className="sidebar-btn sidebar-btn-logout"
            title="Keluar (Logout)"
          >
            <LogOut size={18} />
            <span className="sidebar-btn-text">Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        {/* HEADER BAR */}
        <header className="admin-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <button 
              type="button"
              onClick={toggleSidebar} 
              className="sidebar-toggle-btn"
              title={sidebarCollapsed ? "Buka Menu Sidebar Penuh" : "Sembunyikan Sidebar (Sisakan Icon)"}
              aria-label="Toggle Sidebar"
            >
              {sidebarCollapsed ? <Menu size={19} /> : <ChevronLeft size={19} />}
            </button>
            <h1 className="admin-page-title" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeTab === 'dashboard' && 'Panel Analitik Keuangan'}
              {activeTab === 'pending' && `Verifikasi Bukti Transfer (${pendingDonations.length})`}
              {activeTab === 'offline' && 'Catat Penerimaan Donasi Manual'}
              {activeTab === 'ledger' && 'Buku Besar Laporan Donasi'}
              {activeTab === 'articles' && 'Kelola Kabar & Artikel Dakwah'}
              {activeTab === 'gallery' && 'Kelola Galeri Foto Dokumentasi'}
              {activeTab === 'programs' && 'Kelola Program Asuhan & Prestasi Resmi'}
              {activeTab === 'admins' && 'Kelola Akun Pengurus Yayasan'}
              {activeTab === 'settings' && 'Pengaturan Informasi & Profil Yayasan'}
            </h1>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Status Server: <span style={{ color: '#059669', fontWeight: 700 }}>● Connected MySQL</span>
          </div>
        </header>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Widget Stats Grid */}
            <div className="stats-grid">
              <div className="stat-widget">
                <div className="stat-widget-icon" style={{ background: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32' }}>
                  <DollarSign size={28} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div className="stat-widget-val">{formatRupiah(totalFinancial).replace(',00', '')}</div>
                  <div className="stat-widget-label">Donasi Masuk Terverifikasi</div>
                </div>
              </div>

              <div className="stat-widget">
                <div className="stat-widget-icon" style={{ background: 'rgba(198, 40, 40, 0.1)', color: '#c62828' }}>
                  <DollarSign size={28} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div className="stat-widget-val">{formatRupiah(totalPendingFinancial).replace(',00', '')}</div>
                  <div className="stat-widget-label">Menunggu Verifikasi (Pending)</div>
                </div>
              </div>

              <div className="stat-widget">
                <div className="stat-widget-icon">
                  <Users size={28} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div className="stat-widget-val">{uniqueDonorsCount} Jiwa</div>
                  <div className="stat-widget-label">Donatur Aktif</div>
                </div>
              </div>
            </div>

            {/* Quick Summary list of pending */}
            <div className="ledger-box" style={{ textAlign: 'left' }}>
              <h3 className="serif-title" style={{ fontSize: '20px', color: 'var(--color-emerald-950)', marginBottom: '16px' }}>
                Aktivitas Sistem Terkini
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Log transaksi penggalangan dana terdaftar di sistem.
              </p>
              
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Donatur</th>
                      <th>Jumlah</th>
                      <th>Program</th>
                      <th>Tipe</th>
                      <th>Metode</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.slice(0, 5).map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.donor_name}</strong></td>
                        <td><strong style={{ color: 'var(--color-emerald-800)' }}>{formatRupiah(item.amount).replace(',00', '')}</strong></td>
                        <td>{item.program_name}</td>
                        <td>
                          <span className={`badge ${item.donation_type === 'ONLINE' ? 'badge-online' : 'badge-offline'}`}>
                            {item.donation_type}
                          </span>
                        </td>
                        <td>{item.payment_method}</td>
                        <td>
                          <span className={`badge ${item.status === 'APPROVED' ? 'badge-approved' : item.status === 'PENDING' ? 'badge-pending' : 'badge-rejected'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VERIFICATION QUEUE */}
        {activeTab === 'pending' && (
          <div>
            {pendingDonations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <CheckCircle size={48} style={{ color: 'var(--color-emerald-700)', margin: '0 auto 16px auto' }} />
                <h3 className="serif-title" style={{ color: 'var(--color-emerald-950)' }}>Antrean Bersih!</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Tidak ada bukti transfer baru yang membutuhkan verifikasi Anda saat ini.</p>
              </div>
            ) : (
              <div className="queue-grid">
                {pendingDonations.map((item) => (
                  <div key={item.id} className="queue-card">
                    <div className="queue-header">
                      <div style={{ textAlign: 'left' }}>
                        <span className="queue-date">{formatDate(item.created_at)}</span>
                        <h4 className="queue-donor">{item.donor_name}</h4>
                      </div>
                      <span className="badge badge-pending">PENDING</span>
                    </div>

                    <div className="queue-amount" style={{ textAlign: 'left' }}>
                      {formatRupiah(item.amount).replace(',00', '')}
                    </div>

                    <div className="queue-meta-grid" style={{ textAlign: 'left' }}>
                      <div className="queue-meta-item">
                        <span>Penyaluran Program</span>
                        <strong>{item.program_name}</strong>
                      </div>
                      <div className="queue-meta-item">
                        <span>Metode Transfer</span>
                        <strong>{item.payment_method}</strong>
                      </div>
                    </div>

                    {item.message && (
                      <div style={{ textAlign: 'left', background: '#f8faf8', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontStyle: 'italic', color: '#444' }}>
                        💬 "{item.message}"
                      </div>
                    )}

                    {/* Trigger Pratinjau Gambar Bukti */}
                    {item.receipt_proof && (
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Pratinjau Bukti Transfer (Klik Gambar):</span>
                        <div 
                          className="proof-preview-trigger"
                          onClick={() => setPreviewImage(`/uploads/${item.receipt_proof}`)}
                        >
                          <img src={`/uploads/${item.receipt_proof}`} alt="Bukti Transfer" />
                          <div className="proof-preview-overlay">Pratinjau Penuh</div>
                        </div>
                      </div>
                    )}

                    {/* Tombol Aksi */}
                    <div className="queue-actions">
                      <button 
                        onClick={() => handleVerifyDonation(item.id, 'APPROVED')} 
                        className="btn btn-sm queue-btn queue-btn-approve"
                      >
                        Approve & Terbitkan Kuitansi
                      </button>
                      <button 
                        onClick={() => handleVerifyDonation(item.id, 'REJECTED')} 
                        className="btn btn-sm queue-btn queue-btn-reject"
                      >
                        Reject
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INPUT OFFLINE DONATION */}
        {activeTab === 'offline' && (
          <div className="donate-container" style={{ textAlign: 'left' }}>
            <div className="donate-card">
              <div className="donate-form-body">
                
                {offlineSuccessMsg && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--status-approved-bg)',
                    color: 'var(--status-approved-text)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '24px',
                    fontWeight: 700,
                    fontSize: '14px'
                  }}>
                    ✓ {offlineSuccessMsg}
                  </div>
                )}

                {errorMessage && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--status-rejected-bg)',
                    color: 'var(--status-rejected-text)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '24px',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}>
                    ⚠️ {errorMessage}
                  </div>
                )}

                <form onSubmit={handleAddOffline}>
                  <div className="form-group">
                    <label htmlFor="offline_donor_name">Nama Lengkap Donatur *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        id="offline_donor_name"
                        className="form-input" 
                        style={{ paddingLeft: '44px' }}
                        placeholder="Contoh: Bapak Haji Rian / Hamba Allah"
                        value={offlineForm.donor_name}
                        onChange={(e) => setOfflineForm(prev => ({ ...prev, donor_name: e.target.value }))}
                        required
                      />
                      <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="offline_donor_whatsapp">Nomor WhatsApp Donatur (Untuk PDF) *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="tel" 
                        id="offline_donor_whatsapp"
                        className="form-input" 
                        style={{ paddingLeft: '44px' }}
                        placeholder="Masukkan nomor wa aktif donatur"
                        value={offlineForm.donor_whatsapp}
                        onChange={(e) => setOfflineForm(prev => ({ ...prev, donor_whatsapp: e.target.value }))}
                        required
                      />
                      <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="offline_donor_email">Alamat Email (Opsional)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="email" 
                        id="offline_donor_email"
                        className="form-input" 
                        style={{ paddingLeft: '44px' }}
                        placeholder="Masukkan email donatur"
                        value={offlineForm.donor_email}
                        onChange={(e) => setOfflineForm(prev => ({ ...prev, donor_email: e.target.value }))}
                      />
                      <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="offline_donor_address">Alamat Lengkap Donatur (Opsional)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        id="offline_donor_address"
                        className="form-input" 
                        style={{ paddingLeft: '44px' }}
                        placeholder="Contoh: Kec. Rengasdengklok, Karawang"
                        value={offlineForm.donor_address}
                        onChange={(e) => setOfflineForm(prev => ({ ...prev, donor_address: e.target.value }))}
                      />
                      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '16px', fontWeight: 'bold' }}>🏠</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="offline_amount">Nominal Donasi Tunai / Konfirmasi WA (Rp) *</label>
                    <input 
                      type="number" 
                      id="offline_amount"
                      className="form-input" 
                      placeholder="Masukkan nominal angka bulat, cth: 500000"
                      value={offlineForm.amount}
                      onChange={(e) => setOfflineForm(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      min="10000"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="offline_program">Program Peruntukan *</label>
                    <select 
                      id="offline_program"
                      className="form-input"
                      value={offlineForm.program_name}
                      onChange={(e) => setOfflineForm(prev => ({ ...prev, program_name: e.target.value }))}
                    >
                      <option value="Minggu Ceria Bersama Yatim">Minggu Ceria Bersama Yatim</option>
                      <option value="Tadabur Alam">Tadabur Alam</option>
                      <option value="Buka Puasa Bersama Yatim">Buka Puasa Bersama Yatim</option>
                      <option value="Lebaran untuk Yatim">Lebaran untuk Yatim</option>
                      <option value="Umum & Pembangunan Asrama">Donasi Umum / Kebutuhan Pokok Harian</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="offline_method">Metode Pembayaran *</label>
                    <select 
                      id="offline_method"
                      className="form-input"
                      value={offlineForm.payment_method}
                      onChange={(e) => setOfflineForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    >
                      <option value="Tunai">Tunai / Cash Langsung</option>
                      <option value="Manual WA (BCA)">Transfer Manual Konfirmasi WA (Ke BCA)</option>
                      <option value="Manual WA (Mandiri)">Transfer Manual Konfirmasi WA (Ke Mandiri)</option>
                      <option value="Kotak Amal">Kotak Amal Keliling</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="offline_message">Keterangan / Doa Titipan</label>
                    <textarea 
                      id="offline_message"
                      className="form-input" 
                      placeholder="Tulis pesan atau doa jika ada"
                      value={offlineForm.message}
                      onChange={(e) => setOfflineForm(prev => ({ ...prev, message: e.target.value }))}
                      rows="3"
                      style={{ resize: 'none' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px' }}
                  >
                    Simpan & Unduh PDF Kuitansi Resmi
                  </button>

                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CAS LEDGER */}
        {activeTab === 'ledger' && (
          <div className="ledger-box">
            <div className="table-header" style={{ textAlign: 'left' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 className="serif-title" style={{ fontSize: '20px', color: 'var(--color-emerald-950)' }}>
                  Buku Besar Laporan Keuangan Yayasan
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Arsip seluruh data donasi online, offline, verifikasi maupun penolakan.
                </p>
              </div>

              {/* Search */}
              <div className="form-group search-input" style={{ marginBottom: 0 }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ paddingLeft: '44px', borderRadius: 'var(--radius-full)' }}
                    placeholder="Cari nama, invoice, metode..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Nama Donatur</th>
                    <th>Alamat</th>
                    <th>WhatsApp</th>
                    <th>Jumlah</th>
                    <th>Program</th>
                    <th>Asal</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Kuitansi (PDF)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map((item) => (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-emerald-700)' }}>
                          {item.invoice_number || 'N/A'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong>{item.donor_name}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {item.donor_address || '-'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{item.donor_whatsapp}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong style={{ color: 'var(--color-emerald-800)' }}>{formatRupiah(item.amount).replace(',00', '')}</strong>
                      </td>
                      <td>{item.program_name}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`badge ${item.donation_type === 'ONLINE' ? 'badge-online' : 'badge-offline'}`}>
                          {item.donation_type}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`badge ${item.status === 'APPROVED' ? 'badge-approved' : item.status === 'PENDING' ? 'badge-pending' : 'badge-rejected'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {item.status === 'APPROVED' ? (
                          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handlePrintPDF(item)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                              title="Cetak Kuitansi Resmi"
                            >
                              <Printer size={13} style={{ color: 'var(--color-emerald-700)' }} /> Cetak
                            </button>
                            <button 
                              onClick={() => handleDownloadPDF(item)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                              title="Unduh File PDF Kuitansi"
                            >
                              <Download size={13} style={{ color: 'var(--color-gold-600)' }} /> Unduh
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Unverified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {filteredLedger.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Tidak ada riwayat donasi yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 5: MANAGE ARTICLES */}
        {activeTab === 'articles' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', textAlign: 'left' }}>
            {/* Form Tambah Artikel */}
            <div className="donate-card" style={{ padding: '24px', height: 'fit-content' }}>
              <h3 className="serif-title" style={{ fontSize: '18px', color: 'var(--color-emerald-950)', marginBottom: '16px' }}>Terbitkan Artikel / Berita Baru</h3>
              <form onSubmit={handleAddArticle}>
                <div className="form-group">
                  <label htmlFor="article_title">Judul Artikel *</label>
                  <input
                    type="text"
                    id="article_title"
                    className="form-input"
                    placeholder="Masukkan judul artikel"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="article_category">Kategori *</label>
                  <select
                    id="article_category"
                    className="form-input"
                    value={articleForm.category}
                    onChange={(e) => setArticleForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Edukasi Sosial">Edukasi Sosial</option>
                    <option value="Kegiatan Yayasan">Kegiatan Yayasan</option>
                    <option value="Artikel Opini">Artikel Opini</option>
                    <option value="Kabar Dakwah">Kabar Dakwah</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="article_desc">Isi Artikel *</label>
                  <textarea
                    id="article_desc"
                    className="form-input"
                    rows="6"
                    placeholder="Masukkan isi artikel lengkap..."
                    value={articleForm.desc}
                    onChange={(e) => setArticleForm(prev => ({ ...prev, desc: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="article_image">Gambar Sampul (Opsional)</label>
                  <input
                    type="file"
                    id="article_image"
                    className="form-input"
                    accept="image/*"
                    onChange={(e) => setArticleFile(e.target.files[0])}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Terbitkan Sekarang</button>
              </form>
            </div>

            {/* Daftar Artikel Terbit */}
            <div className="ledger-box" style={{ padding: '24px' }}>
              <h3 className="serif-title" style={{ fontSize: '18px', color: 'var(--color-emerald-950)', marginBottom: '16px' }}>Artikel Terdaftar</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Info Artikel</th>
                      <th>Tanggal</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articlesList.map((art) => (
                      <tr key={art.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--color-emerald-950)' }}>{art.title}</div>
                          <span style={{ fontSize: '11px', color: 'var(--color-emerald-700)', background: 'rgba(15,81,50,0.05)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                            {art.category}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{art.date}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteArticle(art.id)}
                            className="btn btn-sm btn-outline"
                            style={{ borderColor: '#c62828', color: '#c62828', padding: '4px 10px' }}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                    {articlesList.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Belum ada artikel terbit.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MANAGE GALLERY */}
        {activeTab === 'gallery' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', textAlign: 'left' }}>
            {/* Form Tambah Foto */}
            <div className="donate-card" style={{ padding: '24px', height: 'fit-content' }}>
              <h3 className="serif-title" style={{ fontSize: '18px', color: 'var(--color-emerald-950)', marginBottom: '16px' }}>Unggah Dokumentasi Foto</h3>
              <form onSubmit={handleAddGallery}>
                <div className="form-group">
                  <label htmlFor="gallery_title">Nama/Deskripsi Foto *</label>
                  <input
                    type="text"
                    id="gallery_title"
                    className="form-input"
                    placeholder="Contoh: Kunjungan Kebun Raya"
                    value={galleryForm.title}
                    onChange={(e) => setGalleryForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gallery_category">Kategori Dokumentasi *</label>
                  <select
                    id="gallery_category"
                    className="form-input"
                    value={galleryForm.category}
                    onChange={(e) => setGalleryForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Minggu Ceria">Minggu Ceria</option>
                    <option value="Tadabur Alam">Tadabur Alam</option>
                    <option value="Ramadhan">Ramadhan</option>
                    <option value="Lebaran Yatim">Lebaran Yatim</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="gallery_image">Unggah Berkas Foto *</label>
                  <input
                    type="file"
                    id="gallery_image"
                    className="form-input"
                    accept="image/*"
                    onChange={(e) => setGalleryFile(e.target.files[0])}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Unggah Galeri</button>
              </form>
            </div>

            {/* Tabel Foto */}
            <div className="ledger-box" style={{ padding: '24px' }}>
              <h3 className="serif-title" style={{ fontSize: '18px', color: 'var(--color-emerald-950)', marginBottom: '16px' }}>Daftar Galeri</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Gambar Mini</th>
                      <th>Detail Kegiatan</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {galleryList.map((item) => (
                      <tr key={item.id}>
                        <td style={{ width: '80px' }}>
                          <img
                            src={item.image.startsWith('http') ? item.image : `${item.image}`}
                            alt={item.title}
                            style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--color-emerald-950)' }}>{item.title}</div>
                          <span style={{ fontSize: '11px', color: 'var(--color-gold-500)', fontWeight: 600 }}>{item.category}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteGallery(item.id)}
                            className="btn btn-sm btn-outline"
                            style={{ borderColor: '#c62828', color: '#c62828', padding: '4px 10px' }}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                    {galleryList.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Belum ada foto galeri.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: MANAGE PROGRAMS */}
        {activeTab === 'programs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', textAlign: 'left' }}>
            
            {/* BAGIAN PROGRAM */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px' }}>
              {/* Form Tambah Program */}
              <div className="donate-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 className="serif-title" style={{ fontSize: '18px', color: 'var(--color-emerald-950)', marginBottom: '16px' }}>Tambah Program Unggulan</h3>
                <form onSubmit={handleAddProgram}>
                  <div className="form-group">
                    <label>Nama Program *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Minggu Ceria Bersama Yatim"
                      value={programForm.title}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Jadwal Agenda *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Setiap Hari Minggu / Semesteran"
                      value={programForm.schedule}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, schedule: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Deskripsi Agenda *</label>
                    <textarea
                      className="form-input"
                      rows="4"
                      placeholder="Masukkan detail peruntukan dan kegiatan program asuhan..."
                      value={programForm.desc}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, desc: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Unggah Gambar Program *</label>
                    <input
                      type="file"
                      className="form-input"
                      accept="image/*"
                      onChange={(e) => setProgramFile(e.target.files[0])}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Simpan Program</button>
                </form>
              </div>

              {/* Tabel Program */}
              <div className="ledger-box" style={{ padding: '24px' }}>
                <h3 className="serif-title" style={{ fontSize: '18px', color: 'var(--color-emerald-950)', marginBottom: '16px' }}>Program Terdaftar</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Foto</th>
                        <th>Program & Jadwal</th>
                        <th style={{ textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programsList.map((prog) => (
                        <tr key={prog.id}>
                          <td style={{ width: '80px' }}>
                            <img
                              src={prog.image.startsWith('http') ? prog.image : `${prog.image}`}
                              alt={prog.title}
                              style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--color-emerald-950)' }}>{prog.title}</div>
                            <span style={{ fontSize: '12px', color: 'var(--color-emerald-700)', fontWeight: 600 }}>{prog.schedule}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteProgram(prog.id)}
                              className="btn btn-sm btn-outline"
                              style={{ borderColor: '#c62828', color: '#c62828', padding: '4px 10px' }}
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* BAGIAN PRESTASI */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px' }}>
              {/* Form Tambah Prestasi */}
              <div className="donate-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 className="serif-title" style={{ fontSize: '18px', color: 'var(--color-emerald-950)', marginBottom: '16px' }}>Catat Penghargaan Resmi</h3>
                <form onSubmit={handleAddAchievement}>
                  <div className="form-group">
                    <label>Tahun Penghargaan *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: 2021"
                      value={achievementForm.year}
                      onChange={(e) => setAchievementForm(prev => ({ ...prev, year: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Judul Prestasi *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Akreditasi A Kemensos RI"
                      value={achievementForm.title}
                      onChange={(e) => setAchievementForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Deskripsi Penghargaan *</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      placeholder="Masukkan instansi pemberi dan detail prestasi..."
                      value={achievementForm.desc}
                      onChange={(e) => setAchievementForm(prev => ({ ...prev, desc: e.target.value }))}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Simpan Prestasi</button>
                </form>
              </div>

              {/* Tabel Prestasi */}
              <div className="ledger-box" style={{ padding: '24px' }}>
                <h3 className="serif-title" style={{ fontSize: '18px', color: 'var(--color-emerald-950)', marginBottom: '16px' }}>Prestasi Terdaftar</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Tahun</th>
                        <th>Prestasi & Deskripsi</th>
                        <th style={{ textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {achievementsList.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span style={{ background: 'var(--color-gold-500)', color: 'var(--color-emerald-950)', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>
                              {item.year}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--color-emerald-950)' }}>{item.title}</div>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.desc}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteAchievement(item.id)}
                              className="btn btn-sm btn-outline"
                              style={{ borderColor: '#c62828', color: '#c62828', padding: '4px 10px' }}
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB: MANAGE ADMINS */}
        {activeTab === 'admins' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '28px', alignItems: 'start' }}>
              
              {/* Form Tambah Pengurus */}
              <div className="donate-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Tambah Pengurus Baru</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>Buat akun baru untuk akses admin.</p>
                  </div>
                </div>

                <div style={{ height: '1px', background: '#f1f5f9', margin: '16px 0 20px 0' }}></div>

                {adminAddStatus.message && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    background: adminAddStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: adminAddStatus.type === 'success' ? '#166534' : '#991b1b',
                    border: `1px solid ${adminAddStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                  }}>
                    {adminAddStatus.type === 'success' ? '✅ ' : '⚠️ '}
                    {adminAddStatus.message}
                  </div>
                )}

                <form onSubmit={handleAddAdmin}>
                  <div className="form-group">
                    <label>Nama Lengkap Pengurus *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Ust. Ahmad Fauzi"
                      value={newAdminForm.name}
                      onChange={(e) => setNewAdminForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Username Login * (Huruf kecil & angka)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: ahmad_fauzi"
                      value={newAdminForm.username}
                      onChange={(e) => setNewAdminForm(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label>Password Akun * (Minimal 6 karakter)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Buat password akun baru"
                      value={newAdminForm.password}
                      onChange={(e) => setNewAdminForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}
                    disabled={adminAddLoading}
                  >
                    {adminAddLoading ? 'Menyimpan Akun...' : '+ Tambah Akun Pengurus'}
                  </button>
                </form>
              </div>

              {/* Tabel Daftar Pengurus */}
              <div className="ledger-box" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Daftar Akun Pengurus Aktif
                      </h3>
                      <span style={{ fontSize: '12px', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '9999px' }}>
                        {adminsList.length}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0 0' }}>
                      Seluruh akun yang memiliki akses ke panel admin yayasan.
                    </p>
                  </div>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Nama Pengurus</th>
                        <th>Username</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Tanggal Terdaftar</th>
                        <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminsList.map((adm) => {
                        const isSelf = adm.username === adminSession?.username;
                        return (
                          <tr key={adm.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                                {adm.name}
                              </div>
                              {isSelf && (
                                <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 8px', borderRadius: '9999px', marginTop: '3px' }}>
                                  Akun Anda (Sesi Aktif)
                                </span>
                              )}
                            </td>
                            <td>
                              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '12.5px', color: '#047857', background: '#f0fdf4', padding: '3px 8px', borderRadius: '6px', border: '1px solid #dcfce7', fontWeight: 500 }}>
                                @{adm.username}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                {formatCompactDate(adm.created_at)}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isSelf ? (
                                <span style={{ fontSize: '12px', color: '#94a3b8', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', fontWeight: 500, whiteSpace: 'nowrap', border: '1px solid #e2e8f0' }}>
                                  Aktif
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                                  style={{
                                    background: '#ffffff',
                                    color: '#ef4444',
                                    border: '1px solid #fecaca',
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease-in-out'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                                  title="Hapus akun pengurus ini"
                                >
                                  Hapus
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {adminsList.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            Memuat daftar pengurus...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 8: MANAGE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="donate-container" style={{ textAlign: 'left', marginLeft: 0, maxWidth: '800px' }}>
            <div className="donate-card">
              <div className="donate-form-body">
                <h3 className="serif-title" style={{ fontSize: '20px', color: 'var(--color-emerald-950)', marginBottom: '16px' }}>Identitas Umum Yayasan</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>Ubah informasi profil dasar yayasan yang tertera pada kop kuitansi PDF, halaman Profil, dan Footer situs.</p>
                <form onSubmit={handleSaveSettings}>
                  <div className="form-group">
                    <label>Nama Yayasan Resmi *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.foundation_name}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, foundation_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nama Ketua Pengurus *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.chairman_name}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, chairman_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Alamat Lengkap Operasional *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.foundation_address}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, foundation_address: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tahun Berdiri Yayasan *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={settingsForm.founded_year}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, founded_year: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nomor Handphone / WhatsApp Yayasan *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.phone_number}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Alamat Email Yayasan *</label>
                    <input
                      type="email"
                      className="form-input"
                      value={settingsForm.email_address}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, email_address: e.target.value }))}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>Simpan Seluruh Perubahan</button>
                </form>
              </div>
            </div>

            {/* KARTU KEAMANAN & GANTI KATA SANDI */}
            <div className="donate-card" style={{ marginTop: '32px' }}>
              <div className="donate-form-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Lock size={22} style={{ color: 'var(--color-emerald-800)' }} />
                  <h3 className="serif-title" style={{ fontSize: '20px', color: 'var(--color-emerald-950)', margin: 0 }}>Keamanan Akun & Ganti Kata Sandi</h3>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Perbarui kata sandi akun admin pengurus untuk melindungi akses ke dashboard yayasan.
                </p>

                {passwordStatus.message && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: passwordStatus.type === 'success' ? '#e8f5e9' : '#ffebee',
                    color: passwordStatus.type === 'success' ? '#2e7d32' : '#c62828',
                    border: `1px solid ${passwordStatus.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`
                  }}>
                    {passwordStatus.type === 'success' ? '✅ ' : '⚠️ '}
                    {passwordStatus.message}
                  </div>
                )}

                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label>Kata Sandi Saat Ini (Lama) *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Masukkan kata sandi lama"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Kata Sandi Baru * (Minimal 6 karakter)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Masukkan kata sandi baru"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Konfirmasi Kata Sandi Baru *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Ketik ulang kata sandi baru"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '14px' }}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Menyimpan Kata Sandi...' : 'Perbarui Kata Sandi'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: LIGHTBOX PRATINJAU GAMBAR BUKTI TRANSFER */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close-btn" onClick={() => setPreviewImage(null)}>×</button>
            <h3 className="serif-title" style={{ color: 'var(--color-emerald-950)', marginBottom: '16px', textAlign: 'left' }}>
              Bukti Transfer Bank Donatur
            </h3>
            <div style={{ width: '100%', maxHeight: '65vh', overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid #d8e2dc' }}>
              <img src={previewImage} alt="Bukti Transfer Penuh" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
            </div>
            <button onClick={() => setPreviewImage(null)} className="btn btn-primary" style={{ marginTop: '20px', width: '100%' }}>
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {/* RENDER KUITANSI TERSEMBUNYI UNTUK DOWNLOAD DARI CONSOLE ADMIN */}
      {activeReceipt && (
        <div className="print-only-container" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px', height: 'auto', overflow: 'hidden' }}>
          <div id="admin-receipt-print-node">
            <ReceiptPDF donation={activeReceipt} settings={settingsForm} />
          </div>
        </div>
      )}

    </div>
  );
}
