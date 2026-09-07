import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Programs from './components/Programs';
import Gallery from './components/Gallery';
import Articles from './components/Articles';
import Donate from './components/Donate';
import Transparency from './components/Transparency';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { foundationInfo } from './data/mockData';
import { Heart, MapPin, Phone, Mail } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [adminSession, setAdminSession] = useState(null);

  // Cek sesi login admin di localStorage saat pertama kali dimuat
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const name = localStorage.getItem('admin_name');
    const username = localStorage.getItem('admin_username');

    if (token && name && username) {
      setAdminSession({ token, name, username });
    }
  }, []);

  // Handler Navigasi yang memicu scroll otomatis ke atas
  const navigateTo = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler Sukses Login Admin
  const handleLoginSuccess = (token, adminData) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_name', adminData.name);
    localStorage.setItem('admin_username', adminData.username);
    setAdminSession({ token, name: adminData.name, username: adminData.username });
    navigateTo('admin-dashboard');
  };

  // Handler Logout Admin
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    localStorage.removeItem('admin_username');
    setAdminSession(null);
    navigateTo('home');
  };

  // Komponen Footer Bersama
  const SharedFooter = () => (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div style={{ textAlign: 'left' }}>
            <div className="footer-logo-block">
              <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
                <img src="/logo.png" alt="Logo Yayasan" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h3 className="footer-title serif-title">Nurul Aitam Karawang</h3>
            </div>
            <p className="footer-desc">
              Lembaga Kesejahteraan Sosial Anak (LKSA) terpercaya, berkomitmen mengasuh, mendidik,
              dan membahagiakan anak-anak yatim piatu sejak 1999 di Karawang.
            </p>
          </div>

          {/* Links */}
          <div style={{ textAlign: 'left' }}>
            <h4 className="footer-links-title">Navigasi</h4>
            <ul className="footer-menu">
              <li><a href="#tentang" className="footer-link" onClick={(e) => { e.preventDefault(); navigateTo('home'); setTimeout(() => document.getElementById('tentang')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Profil Yayasan</a></li>
              <li><a href="#program" className="footer-link" onClick={(e) => { e.preventDefault(); navigateTo('home'); setTimeout(() => document.getElementById('program')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Program Asuhan</a></li>
              <li><a href="#galeri" className="footer-link" onClick={(e) => { e.preventDefault(); navigateTo('home'); setTimeout(() => document.getElementById('galeri')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Galeri Foto</a></li>
              <li><a href="#transparansi" className="footer-link" onClick={(e) => { e.preventDefault(); navigateTo('transparency'); }}>Laporan Keuangan</a></li>
            </ul>
          </div>

          {/* Hubungi Kami */}
          <div style={{ textAlign: 'left' }}>
            <h4 className="footer-links-title">Hubungi Kami</h4>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <MapPin className="footer-contact-icon" size={20} />
                <span>{foundationInfo.address}</span>
              </div>
              <div className="footer-contact-item">
                <Phone className="footer-contact-icon" size={20} />
                <span>{foundationInfo.phone}</span>
              </div>
              <div className="footer-contact-item">
                <Mail className="footer-contact-icon" size={20} />
                <span>{foundationInfo.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} <strong>Yayasan Nurul Aitam Karawang</strong>. Hak Cipta Dilindungi.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            Dikelola dengan ❤️ oleh Pengurus | <a href="#" style={{ textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); navigateTo('admin-login'); }}>Login Staf</a>
          </div>
        </div>
      </div>
    </footer>
  );

  // PENGATURAN ROUTING RENDER TAMPILAN
  return (
    <div className="App">
      
      {/* Tampilkan Navbar jika bukan di halaman login atau dashboard admin yang butuh sidebar khusus */}
      {currentView !== 'admin-login' && currentView !== 'admin-dashboard' && (
        <Navbar 
          currentView={currentView} 
          navigateTo={navigateTo} 
          adminSession={adminSession}
          onLogout={handleLogout}
        />
      )}

      {/* RENDER VIEW SPESIFIK */}
      
      {/* 1. PORTAL UTAMA WEBSITE (HOME) */}
      {currentView === 'home' && (
        <>
          <Hero navigateTo={navigateTo} />
          <About />
          <Programs />
          <Gallery />
          <Articles />
          <SharedFooter />
        </>
      )}

      {/* 2. FORM DONASI ONLINE */}
      {currentView === 'donate' && (
        <>
          <div style={{ height: '100px' }}></div> {/* Spacer */}
          <Donate navigateTo={navigateTo} />
          <SharedFooter />
        </>
      )}

      {/* 3. HALAMAN TRANSPARANSI DONASI */}
      {currentView === 'transparency' && (
        <>
          <div style={{ height: '100px' }}></div> {/* Spacer */}
          <Transparency />
          <SharedFooter />
        </>
      )}

      {/* 4. LOGIN PORTAL ADMIN */}
      {currentView === 'admin-login' && (
        <AdminLogin 
          onLoginSuccess={handleLoginSuccess} 
          navigateTo={navigateTo} 
        />
      )}

      {/* 5. DASHBOARD UTAMA ADMIN CONTROL PANEL */}
      {currentView === 'admin-dashboard' && (
        adminSession ? (
          <AdminDashboard 
            adminSession={adminSession} 
            onLogout={handleLogout} 
            navigateTo={navigateTo} 
          />
        ) : (
          // Proteksi route: Redirect ke login jika belum ada sesi admin
          <AdminLogin 
            onLoginSuccess={handleLoginSuccess} 
            navigateTo={navigateTo} 
          />
        )
      )}

    </div>
  );
}

export default App;
