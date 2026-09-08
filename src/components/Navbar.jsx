import React, { useState, useEffect } from 'react';
import { Heart, Lock, Layout, Menu, X, LogOut } from 'lucide-react';
import { foundationInfo } from '../data/mockData';

export default function Navbar({ currentView, navigateTo, adminSession, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (view) => {
    navigateTo(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-wrapper" style={{ top: scrolled ? '0px' : '20px' }}>
      <div className="container">
        <nav className="navbar" style={{ 
          borderRadius: scrolled ? '0px' : '9999px',
          borderLeft: scrolled ? 'none' : '1px solid rgba(255, 255, 255, 0.4)',
          borderRight: scrolled ? 'none' : '1px solid rgba(255, 255, 255, 0.4)',
          borderTop: scrolled ? 'none' : '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.1)' : 'var(--shadow-md)',
          background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)'
        }}>
          {/* Logo & Brand */}
          <a href="#" className="navbar-brand" onClick={() => handleNavClick('home')}>
            <div className="navbar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
              <img src="/logo.png" alt="Logo Yayasan" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="navbar-title serif-title">
              Nurul Aitam
              <span style={{ display: 'block', fontSize: '10px', fontWeight: 500, letterSpacing: '0.5px', fontFamily: "'Outfit', sans-serif" }}>
                Karawang
              </span>
            </div>
          </a>

          {/* Desktop Nav Items */}
          <ul className="navbar-nav">
            <li>
              <a 
                href="#tentang" 
                className={`navbar-link ${currentView === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('home')}
              >
                Beranda
              </a>
            </li>
            <li>
              <a 
                href="#program" 
                className="navbar-link"
                onClick={() => {
                  navigateTo('home');
                  setTimeout(() => {
                    document.getElementById('program')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Program
              </a>
            </li>
            <li>
              <a 
                href="#galeri" 
                className="navbar-link"
                onClick={() => {
                  navigateTo('home');
                  setTimeout(() => {
                    document.getElementById('galeri')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Galeri
              </a>
            </li>
            <li>
              <a 
                href="#transparansi" 
                className={`navbar-link ${currentView === 'transparency' ? 'active' : ''}`}
                onClick={() => handleNavClick('transparency')}
              >
                Transparansi Laporan
              </a>
            </li>
            <li>
              <a 
                href="#artikel" 
                className="navbar-link"
                onClick={() => {
                  navigateTo('home');
                  setTimeout(() => {
                    document.getElementById('artikel')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Artikel
              </a>
            </li>
          </ul>

          {/* CTA & Actions */}
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Tombol Donasi Desktop */}
            <button 
              onClick={() => navigateTo('donate')} 
              className="btn btn-primary btn-sm btn-gold nav-donate-desktop"
              style={{ fontWeight: 700 }}
            >
              <Heart size={16} fill="currentColor" /> Donasi Sekarang
            </button>

            {/* Tombol Donasi Mini Khusus Mobile */}
            <button 
              onClick={() => navigateTo('donate')} 
              className="btn btn-primary btn-sm btn-gold nav-donate-mobile"
              style={{ fontWeight: 700 }}
              title="Salurkan Donasi"
            >
              <Heart size={14} fill="currentColor" /> Donasi
            </button>

            {/* Tombol Admin Desktop */}
            <div className="nav-admin-desktop">
              {adminSession ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => navigateTo('admin-dashboard')} 
                    className="btn btn-outline btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Layout size={16} /> Panel Admin
                  </button>
                  <button 
                    onClick={onLogout} 
                    className="btn btn-sm btn-outline" 
                    style={{ borderColor: 'hsl(0, 80%, 40%)', color: 'hsl(0, 80%, 40%)', padding: '8px' }}
                    title="Logout Admin"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => navigateTo('admin-login')} 
                  className="btn btn-outline btn-sm"
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Login Pengurus"
                >
                  <Lock size={15} /> <span style={{ fontSize: '13px' }}>Admin</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="btn btn-outline btn-sm mobile-toggle" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu navigasi"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer / Overlay Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-container" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-emerald-950)' }}>
                    Nurul Aitam
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    Karawang
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-menu-close"
                title="Tutup Menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mobile-menu-links">
              <a 
                href="#tentang" 
                className={`mobile-nav-link ${currentView === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('home')}
              >
                <span>🏠</span> Beranda
              </a>
              <a 
                href="#tentang" 
                className="mobile-nav-link"
                onClick={() => {
                  navigateTo('home');
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('tentang')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
              >
                <span>🏛️</span> Profil Yayasan
              </a>
              <a 
                href="#program" 
                className="mobile-nav-link"
                onClick={() => {
                  navigateTo('home');
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('program')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
              >
                <span>✨</span> Program Asuhan
              </a>
              <a 
                href="#galeri" 
                className="mobile-nav-link"
                onClick={() => {
                  navigateTo('home');
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('galeri')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
              >
                <span>📷</span> Galeri Foto
              </a>
              <a 
                href="#transparansi" 
                className={`mobile-nav-link ${currentView === 'transparency' ? 'active' : ''}`}
                onClick={() => handleNavClick('transparency')}
              >
                <span>📊</span> Transparansi Laporan
              </a>
              <a 
                href="#artikel" 
                className="mobile-nav-link"
                onClick={() => {
                  navigateTo('home');
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('artikel')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
              >
                <span>📰</span> Kabar & Artikel
              </a>
            </nav>

            <div className="mobile-menu-divider" />

            <div className="mobile-menu-actions">
              <button 
                onClick={() => handleNavClick('donate')} 
                className="btn btn-gold btn-mobile-action"
              >
                <Heart size={16} fill="currentColor" /> Salurkan Donasi Sekarang
              </button>

              {adminSession ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleNavClick('admin-dashboard')} 
                    className="btn btn-outline btn-mobile-action"
                    style={{ flex: 1 }}
                  >
                    <Layout size={16} /> Panel Admin
                  </button>
                  <button 
                    onClick={() => { onLogout(); setMobileMenuOpen(false); }} 
                    className="btn btn-outline" 
                    style={{ borderColor: '#ef4444', color: '#ef4444', padding: '12px' }}
                    title="Keluar"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleNavClick('admin-login')} 
                  className="btn btn-outline btn-mobile-action"
                >
                  <Lock size={15} /> Masuk Panel Pengurus (Admin)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
