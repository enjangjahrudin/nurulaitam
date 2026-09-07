import React from 'react';
import { Heart, Award, ShieldCheck } from 'lucide-react';
import { foundationInfo } from '../data/mockData';

// Fungsi Rekursif Otomatis Mengubah Angka Menjadi Kalimat Terbilang Bahasa Indonesia
function angkaKeTerbilang(nominal) {
  const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let hasil = "";
  let n = Math.floor(nominal);
  
  if (n < 12) {
    hasil = " " + angka[n];
  } else if (n < 20) {
    hasil = angkaKeTerbilang(n - 10) + " Belas";
  } else if (n < 100) {
    hasil = angkaKeTerbilang(Math.floor(n / 10)) + " Puluh" + angkaKeTerbilang(n % 10);
  } else if (n < 200) {
    hasil = " Seratus" + angkaKeTerbilang(n - 100);
  } else if (n < 1000) {
    hasil = angkaKeTerbilang(Math.floor(n / 100)) + " Ratus" + angkaKeTerbilang(n % 100);
  } else if (n < 2000) {
    hasil = " Seribu" + angkaKeTerbilang(n - 1000);
  } else if (n < 1000000) {
    hasil = angkaKeTerbilang(Math.floor(n / 1000)) + " Ribu" + angkaKeTerbilang(n % 1000);
  } else if (n < 1000000000) {
    hasil = angkaKeTerbilang(Math.floor(n / 1000000)) + " Juta" + angkaKeTerbilang(n % 1000000);
  } else if (n < 1000000000000) {
    hasil = angkaKeTerbilang(Math.floor(n / 1000000000)) + " Milyar" + angkaKeTerbilang(n % 1000000000);
  }
  
  return hasil.trim();
}

export default function ReceiptPDF({ donation, settings }) {
  if (!donation) return null;

  const info = settings && settings.chairman_name ? {
    name: settings.foundation_name,
    address: settings.foundation_address,
    chairman: settings.chairman_name,
    phone: settings.phone_number,
    email: settings.email_address
  } : {
    name: foundationInfo.name,
    address: foundationInfo.address,
    chairman: foundationInfo.chairman,
    phone: foundationInfo.phone,
    email: foundationInfo.email
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const terbilangKalimat = `${angkaKeTerbilang(donation.amount)} Rupiah`;

  return (
    <div className="receipt-wrapper">
      <div className="receipt-watermark">NURUL AITAM</div>

      {/* 1. KOP SURAT RESMI */}
      <div className="receipt-header">
        <div className="receipt-logo-block">
          <div className="receipt-logo-circle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', width: '60px', height: '60px' }}>
            <img src="/logo.png" alt="Logo Yayasan" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="receipt-kop">
            <h2 className="receipt-kop-title serif-title">{info.name}</h2>
            <div className="receipt-kop-address">
              Akte Notaris No. 14 Tahun 1999 | SK Kemenkumham RI No. AHU-4213.AH.01.04<br />
              Sekretariat: {info.address}<br />
              Telepon: {info.phone} | Email: {info.email}
            </div>
          </div>
        </div>
        <div className="receipt-title-block">
          <h1 className="receipt-main-title serif-title">Kuitansi Resmi</h1>
          <div className="receipt-number">INV NO: {donation.invoice_number || 'PENDING'}</div>
        </div>
      </div>

      {/* 2. DOKUMEN ISI DETAIL KUITANSI */}
      <div style={{ margin: '32px 0' }}>
        <div className="receipt-grid">
          <div className="receipt-label">Telah Diterima Dari</div>
          <div>:</div>
          <div className="receipt-value receipt-value-strong">{donation.donor_name}</div>
          
          <div className="receipt-label">Nomor WhatsApp</div>
          <div>:</div>
          <div className="receipt-value">{donation.donor_whatsapp || '-'}</div>

          {donation.donor_address && (
            <>
              <div className="receipt-label">Alamat Donatur</div>
              <div>:</div>
              <div className="receipt-value">{donation.donor_address}</div>
            </>
          )}

          {donation.donor_email && (
            <>
              <div className="receipt-label">Alamat Email</div>
              <div>:</div>
              <div className="receipt-value">{donation.donor_email}</div>
            </>
          )}

          <div className="receipt-label">Uang Sejumlah</div>
          <div>:</div>
          <div className="receipt-value receipt-terbilang-box">{terbilangKalimat}</div>

          <div className="receipt-label">Untuk Pembayaran</div>
          <div>:</div>
          <div className="receipt-value">
            Penyaluran Donasi Program <strong>{donation.program_name}</strong>
          </div>

          <div className="receipt-label">Metode Transfer</div>
          <div>:</div>
          <div className="receipt-value">
            {donation.payment_method} ({donation.donation_type === 'ONLINE' ? 'Online Transfer' : 'Offline / Manual'})
          </div>

          {donation.message && (
            <>
              <div className="receipt-label">Pesan / Doa</div>
              <div>:</div>
              <div className="receipt-value" style={{ fontStyle: 'italic', color: '#444' }}>
                "{donation.message}"
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. BAGIAN NOMINAL & TANDA TANGAN */}
      <div className="receipt-amount-block">
        {/* Nominal Besar */}
        <div className="receipt-amount-box">
          <span className="receipt-amount-label">Jumlah</span>
          <span className="receipt-amount-val">{formatRupiah(donation.amount).replace(',00', '')}</span>
        </div>

        {/* Tanda Tangan & Seal Pengesahan */}
        <div className="receipt-sign-box">
          <div className="receipt-date">Karawang, {formatDate(donation.verified_at || donation.created_at)}</div>
          <div className="receipt-sign-role">Ketua Yayasan</div>
          
          {/* Tanda Tangan Tulis Indah (SVG Representatif) */}
          <svg className="receipt-signature-img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#092e1e' }}>
            <path d="M10 25c10-2 15-20 20-20s8 30 18 30 12-25 15-25 5 15 15 15 10-10 12-10" />
            <path d="M25 15c15 0 25 10 35 10" />
          </svg>

          {/* Cap Stempel Yayasan (SVG Representatif Emas Bulat) */}
          <div className="receipt-stamp-gold">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'rgba(15, 81, 50, 0.65)' }}>
              <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="1" />
              <path d="M25 40h30" stroke="currentColor" strokeWidth="1.5" />
              <text x="50%" y="34%" dominantBaseline="middle" textAnchor="middle" fill="currentColor" style={{ fontSize: '7px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>NURUL AITAM</text>
              <text x="50%" y="46%" dominantBaseline="middle" textAnchor="middle" fill="currentColor" style={{ fontSize: '5px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>KARAWANG</text>
              <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="currentColor" style={{ fontSize: '4px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>* TERAKREDITASI A *</text>
            </svg>
          </div>

          <div className="receipt-sign-name">{info.chairman}</div>
        </div>
      </div>

      {/* 4. FOOTER KUITANSI */}
      <div className="receipt-footer-msg">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px', fontWeight: 'bold', color: 'var(--color-emerald-800)' }}>
          <ShieldCheck size={16} /> Kuitansi Elektronik Sah | Didukung oleh Sistem Donasi Akuntabel
        </div>
        Terima kasih atas kepedulian Anda. Donasi yang Anda berikan sangat berarti bagi kehidupan dan masa depan anak-anak yatim piatu kami.
      </div>
    </div>
  );
}
