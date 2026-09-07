import React, { useState } from 'react';
import { Lock, User, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, navigateTo }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Username atau password salah.');
      }

      // Berhasil login
      onLoginSuccess(data.token, data.admin);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal tersambung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-layout">
      <div className="login-card">
        {/* Tombol Kembali ke Beranda */}
        <button 
          onClick={() => navigateTo('home')} 
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 600,
            marginBottom: '20px'
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Web Publik
        </button>

        <div className="login-header">
          <div className="login-logo">
            <Lock size={28} />
          </div>
          <h2 className="login-title serif-title">Login Pengurus</h2>
          <p className="login-subtitle">Masukkan kredensial admin Yayasan Nurul Aitam</p>
        </div>

        {errorMessage && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--status-rejected-bg)',
            color: 'var(--status-rejected-text)',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label htmlFor="username">Username Admin</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                id="username"
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                id="password"
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={loading}
          >
            {loading ? 'Memvalidasi...' : 'Masuk ke Dashboard'}
          </button>
        </form>

        <div style={{ 
          marginTop: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '6px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <ShieldCheck size={14} style={{ color: 'var(--color-emerald-700)' }} /> Terkoneksi ke MySQL Server
        </div>
      </div>
    </div>
  );
}
