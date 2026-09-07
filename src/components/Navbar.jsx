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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => navigateTo('donate')} 
              className="btn btn-primary btn-sm btn-gold"
              style={{ fontWeight: 700 }}
            >
              <Heart size={16} fill="currentColor" /> Donasi Sekarang
            </button>

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

            {/* Mobile Menu Toggle */}
            <button 
              className="btn btn-outline btn-sm mobile-toggle" 
              style={{ display: 'none', padding: '8px' }} 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="container" style={{ marginTop: '8px' }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '24px', 
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <a href="#tentang" className="navbar-link" onClick={() => handleNavClick('home')}>Beranda</a>
            <a href="#program" className="navbar-link" onClick={() => {
              navigateTo('home');
              setMobileMenuOpen(false);
              setTimeout(() => document.getElementById('program')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}>Program</a>
            <a href="#galeri" className="navbar-link" onClick={() => {
              navigateTo('home');
              setMobileMenuOpen(false);
              setTimeout(() => document.getElementById('galeri')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}>Galeri</a>
            <a href="#transparansi" className="navbar-link" onClick={() => handleNavClick('transparency')}>Transparansi Laporan</a>
            <a href="#artikel" className="navbar-link" onClick={() => {
              navigateTo('home');
              setMobileMenuOpen(false);
              setTimeout(() => document.getElementById('artikel')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}>Artikel</a>
          </div>
        </div>
      )}

      {/* Custom Inline CSS rule for Mobile View Hamburger Toggle display */}
      <style>{`
        @media (max-width: 768px) {
          .navbar-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}
