import React, { useState } from 'react';
import { User, Phone, Mail, Award, CheckCircle, ArrowRight, ArrowLeft, Upload, Copy, Check } from 'lucide-react';

export default function Donate({ navigateTo }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copiedBank, setCopiedBank] = useState(null);
  
  // State Form Donasi
  const [formData, setFormData] = useState({
    donor_name: '',
    donor_whatsapp: '',
    donor_email: '',
    donor_address: '',
    amount: '',
    customAmount: '',
    program_name: 'Minggu Ceria Bersama Yatim',
    payment_method: 'BCA',
    message: ''
  });
  
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const quickAmounts = [50000, 100000, 250000, 500000, 1000000];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmountSelect = (amt) => {
    setFormData(prev => ({
      ...prev,
      amount: amt,
      customAmount: '' // Reset custom
    }));
  };

  const handleCustomAmountChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      customAmount: val,
      amount: val // Sinkronkan ke amount
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setErrorMessage('Hanya berkas gambar (JPG, PNG, WEBP) yang diperbolehkan!');
        return;
      }
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const copyToClipboard = (text, bank) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  // Validasi Step 1
  const validateStep1 = () => {
    if (!formData.donor_name.trim()) return 'Nama donatur harus diisi.';
    if (!formData.donor_whatsapp.trim()) return 'Nomor WhatsApp aktif wajib diisi.';
    if (!formData.program_name) return 'Pilih salah satu peruntukan program.';
    return null;
  };

  // Validasi Step 2
  const validateStep2 = () => {
    const finalAmount = formData.amount || formData.customAmount;
    if (!finalAmount || parseFloat(finalAmount) <= 0) return 'Tentukan nominal donasi Anda.';
    if (isNaN(parseFloat(finalAmount))) return 'Nominal donasi harus berupa angka.';
    return null;
  };

  const nextStep = () => {
    setErrorMessage('');
    if (step === 1) {
      const err = validateStep1();
      if (err) { setErrorMessage(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setErrorMessage(err); return; }
      setStep(3);
    }
  };

  const prevStep = () => {
    setErrorMessage('');
    setStep(prev => prev - 1);
  };

  // Submit Donasi Online ke Express API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!receiptFile) {
      setErrorMessage('Harap unggah berkas bukti transfer Anda.');
      return;
    }

    setLoading(true);

    const submissionData = new FormData();
    submissionData.append('donor_name', formData.donor_name);
    submissionData.append('donor_whatsapp', formData.donor_whatsapp);
    submissionData.append('donor_email', formData.donor_email);
    submissionData.append('donor_address', formData.donor_address);
    submissionData.append('amount', formData.amount || formData.customAmount);
    submissionData.append('program_name', formData.program_name);
    submissionData.append('payment_method', formData.payment_method);
    submissionData.append('message', formData.message);
    submissionData.append('receipt', receiptFile);

    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        body: submissionData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengirim donasi.');
      }

      // Berhasil
      setStep(4);
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi gangguan jaringan, coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Format nominal rupiah
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <section className="section-padding donate-section" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center' }}>
      <div className="container">
        <div className="donate-container">
          
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <span className="section-badge" style={{ background: 'var(--color-gold-400)', color: 'var(--color-emerald-950)' }}>
              Amanah Donasi
            </span>
            <h2 className="section-title serif-title">Salurkan Kepedulian Anda</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
              Ikuti langkah mudah di bawah untuk menyalurkan santunan terbaik bagi anak asuh Nurul Aitam Karawang.
            </p>
          </div>

          <div className="donate-card">
            {/* Step Indicators */}
            <div className="donate-steps">
              <div className={`donate-step-indicator ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                1. Data Diri
              </div>
              <div className={`donate-step-indicator ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                2. Nominal
              </div>
              <div className={`donate-step-indicator ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                3. Pembayaran
              </div>
            </div>

            {/* Form Box */}
            <div className="donate-form-body">
              {errorMessage && (
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--status-rejected-bg)',
                  color: 'var(--status-rejected-text)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '24px',
                  fontWeight: 600,
                  fontSize: '14px',
                  textAlign: 'left'
                }}>
                  {errorMessage}
                </div>
              )}

              {/* STEP 1: INFORMASI DONATUR */}
              {step === 1 && (
                <div style={{ textAlign: 'left' }}>
                  <div className="form-group">
                    <label htmlFor="donor_name">Nama Lengkap Donatur *</label>
                    <input 
                      type="text" 
                      id="donor_name"
                      name="donor_name"
                      value={formData.donor_name}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama Anda (bisa Hamba Allah)"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="donor_whatsapp">Nomor WhatsApp Aktif *</label>
                    <input 
                      type="tel" 
                      id="donor_whatsapp"
                      name="donor_whatsapp"
                      value={formData.donor_whatsapp}
                      onChange={handleInputChange}
                      placeholder="Contoh: 0812XXXXXXXX (untuk kirim kuitansi)"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="donor_email">Alamat Email (Opsional)</label>
                    <input 
                      type="email" 
                      id="donor_email"
                      name="donor_email"
                      value={formData.donor_email}
                      onChange={handleInputChange}
                      placeholder="Masukkan alamat email Anda"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="donor_address">Alamat Lengkap Donatur (Opsional)</label>
                    <input 
                      type="text" 
                      id="donor_address"
                      name="donor_address"
                      value={formData.donor_address}
                      onChange={handleInputChange}
                      placeholder="Contoh: Kec. Rengasdengklok, Karawang"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="program_name">Pilih Program Penyaluran *</label>
                    <select 
                      id="program_name"
                      name="program_name"
                      value={formData.program_name}
                      onChange={handleInputChange}
                      className="form-input"
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="Minggu Ceria Bersama Yatim">Minggu Ceria Bersama Yatim</option>
                      <option value="Tadabur Alam">Tadabur Alam</option>
                      <option value="Buka Puasa Bersama Yatim">Buka Puasa Bersama Yatim</option>
                      <option value="Lebaran untuk Yatim">Lebaran untuk Yatim</option>
                      <option value="Umum & Pembangunan Asrama">Donasi Umum / Kebutuhan Pokok Harian</option>
                    </select>
                  </div>

                  <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                    <button onClick={nextStep} className="btn btn-primary">
                      Lanjutkan <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: NOMINAL DONASI */}
              {step === 2 && (
                <div style={{ textAlign: 'left' }}>
                  <div className="form-group">
                    <label>Pilih Nominal Donasi Tercepat</label>
                    <div className="amount-grid">
                      {quickAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleAmountSelect(amt)}
                          className={`amount-btn ${formData.amount === amt ? 'active' : ''}`}
                        >
                          {formatRupiah(amt).replace(',00', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="customAmount">Atau Masukkan Nominal Kustom (Rp)</label>
                    <input 
                      type="number" 
                      id="customAmount"
                      name="customAmount"
                      value={formData.customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="Contoh: 150000"
                      className="form-input"
                      min="10000"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Doa / Pesan Kebaikan (Opsional)</label>
                    <textarea 
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tuliskan doa atau pesan Anda untuk anak-anak yatim..."
                      className="form-input"
                      rows="3"
                      style={{ resize: 'none' }}
                    />
                  </div>

                  <div className="form-actions">
                    <button onClick={prevStep} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ArrowLeft size={16} /> Kembali
                    </button>
                    <button onClick={nextStep} className="btn btn-primary">
                      Lanjutkan <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: REKENING TRANSFER & UPLOAD BUKTI */}
              {step === 3 && (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '15px', color: 'var(--color-emerald-950)', fontWeight: 600 }}>
                      Silakan lakukan transfer sebesar <span style={{ color: 'var(--color-emerald-800)', fontWeight: 800, fontSize: '18px' }}>
                        {formatRupiah(formData.amount || formData.customAmount)}
                      </span> ke rekening resmi Yayasan Nurul Aitam Karawang di bawah ini:
                    </p>
                  </div>

                  {/* Informasi Bank Box */}
                  <div className="bank-account-box">
                    <div className="bank-row">
                      <div className="bank-info">
                        <span className="bank-name">BANK BCA</span>
                        <span className="bank-number">1098 7654 32</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>a.n. YAYASAN NURUL AITAM</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard('1098765432', 'BCA')} 
                        className="btn btn-sm btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
                      >
                        {copiedBank === 'BCA' ? <Check size={14} /> : <Copy size={14} />}
                        {copiedBank === 'BCA' ? 'Tersalin' : 'Salin Rek'}
                      </button>
                    </div>

                    <div className="bank-row">
                      <div className="bank-info">
                        <span className="bank-name">BANK MANDIRI</span>
                        <span className="bank-number">173 00 9876543 2</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>a.n. YAYASAN NURUL AITAM</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard('1730098765432', 'MANDIRI')} 
                        className="btn btn-sm btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
                      >
                        {copiedBank === 'MANDIRI' ? <Check size={14} /> : <Copy size={14} />}
                        {copiedBank === 'MANDIRI' ? 'Tersalin' : 'Salin Rek'}
                      </button>
                    </div>
                  </div>

                  {/* Pilihan Metode Bank yang Digunakan */}
                  <div className="form-group">
                    <label htmlFor="payment_method">Bank Pengirim Anda *</label>
                    <select 
                      id="payment_method"
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="BCA">Transfer dari Bank BCA</option>
                      <option value="Mandiri">Transfer dari Bank Mandiri</option>
                      <option value="BRI">Transfer dari Bank BRI</option>
                      <option value="BNI">Transfer dari Bank BNI</option>
                      <option value="Syariah">Transfer dari Bank Syariah Indonesia (BSI)</option>
                      <option value="Lainnya">Transfer dari Bank Lainnya</option>
                    </select>
                  </div>

                  {/* Area Upload Bukti Transfer */}
                  <div className="form-group">
                    <label>Unggah Gambar Bukti Transfer Anda *</label>
                    <div 
                      className="upload-area"
                      onClick={() => document.getElementById('receipt-input').click()}
                    >
                      <input 
                        type="file"
                        id="receipt-input"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept="image/*"
                      />
                      <Upload className="upload-icon" style={{ margin: '0 auto 12px auto' }} />
                      <p style={{ fontWeight: 600, color: 'var(--color-emerald-950)' }}>Klik di sini untuk mengunggah berkas foto</p>
                      <span className="upload-text">Mendukung format JPG, PNG, WEBP hingga maksimal 5MB</span>
                      
                      {receiptPreview && (
                        <div>
                          <img src={receiptPreview} alt="Bukti Transfer Preview" className="upload-preview" />
                          <p style={{ fontSize: '12px', color: 'var(--color-emerald-700)', fontWeight: 600, marginTop: '8px' }}>
                            ✓ {receiptFile.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button onClick={prevStep} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ArrowLeft size={16} /> Kembali
                    </button>
                    <button 
                      onClick={handleSubmit} 
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ minWidth: '160px' }}
                    >
                      {loading ? 'Mengirim...' : 'Konfirmasi Donasi'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SUKSES DIKIRIM */}
              {step === 4 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle size={72} style={{ color: 'var(--color-emerald-700)', fill: 'rgba(15, 81, 50, 0.05)', margin: '0 auto 24px auto' }} />
                  <h3 className="serif-title" style={{ fontSize: '28px', color: 'var(--color-emerald-950)', marginBottom: '16px' }}>
                    Alhamdulillah, Terima Kasih!
                  </h3>
                  <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
                    Donasi sebesar <strong>{formatRupiah(formData.amount || formData.customAmount)}</strong> telah berhasil kami terima sistem. 
                    Selanjutnya, pengurus Yayasan Nurul Aitam Karawang akan segera memverifikasi bukti transfer Anda. 
                    Kuitansi tanda penerimaan donasi resmi (PDF) akan dikirimkan ke nomor WhatsApp donatur Anda.
                  </p>

                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => navigateTo('transparency')} 
                      className="btn btn-outline"
                    >
                      Lihat Laporan Mutasi
                    </button>
                    <button 
                      onClick={() => {
                        // Reset Form
                        setFormData({
                          donor_name: '',
                          donor_whatsapp: '',
                          donor_email: '',
                          donor_address: '',
                          amount: '',
                          customAmount: '',
                          program_name: 'Minggu Ceria Bersama Yatim',
                          payment_method: 'BCA',
                          message: ''
                        });
                        setReceiptFile(null);
                        setReceiptPreview(null);
                        setStep(1);
                        navigateTo('home');
                      }} 
                      className="btn btn-primary"
                    >
                      Kembali ke Beranda
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
