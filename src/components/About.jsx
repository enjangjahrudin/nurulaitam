import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, MapPin } from 'lucide-react';
import { achievementsList as staticAchievements, foundationInfo as staticInfo } from '../data/mockData';
import ScrollReveal from './ScrollReveal';

export default function About() {
  const [info, setInfo] = useState(staticInfo);
  const [achievements, setAchievements] = useState(staticAchievements);

  useEffect(() => {
    // Ambil data info yayasan
    fetch('/api/settings')
      .then(res => {
        if (!res.ok) throw new Error('Offline');
        return res.json();
      })
      .then(data => {
        if (data && data.chairman_name) {
          setInfo({
            name: data.foundation_name || staticInfo.name,
            address: data.foundation_address || staticInfo.address,
            chairman: data.chairman_name || staticInfo.chairman,
            foundedYear: data.founded_year || staticInfo.foundedYear,
            phone: data.phone_number || staticInfo.phone,
            email: data.email_address || staticInfo.email,
          });
        }
      })
      .catch(() => console.log('Menggunakan info yayasan bawaan (statis).'));

    // Ambil data prestasi
    fetch('/api/achievements')
      .then(res => {
        if (!res.ok) throw new Error('Offline');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAchievements(data);
        }
      })
      .catch(() => console.log('Menggunakan prestasi bawaan (statis).'));
  }, []);

  return (
    <section id="tentang" className="section-padding">
      <div className="container">
        {/* Section Title */}
        <ScrollReveal>
          <div className="text-center">
            <span className="section-badge">Profil Yayasan</span>
            <h2 className="section-title serif-title">Menyebarkan Amanah Sejak {info.foundedYear}</h2>
            <p className="section-subtitle">
              Dua dekade lebih berkiprah dalam menyantuni, membimbing, dan memberikan rumah penuh kasih sayang bagi ratusan anak yatim piatu di Karawang.
            </p>
          </div>
        </ScrollReveal>

        <div className="about-grid">
          {/* Sisi Kiri: Profil Ketua & Info Yayasan */}
          <ScrollReveal delay={150}>
            <div className="about-leader">
              <div className="leader-img-wrapper" style={{ display: 'block', padding: 0 }}>
                <img 
                  src="/chairman.jpg" 
                  alt={info.chairman} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <h4 className="leader-name">{info.chairman}</h4>
              <div className="leader-role">Ketua Yayasan</div>
              
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
                "Mengasuh anak yatim bukan sekadar memberi mereka makan dan pakaian, melainkan memberikan rasa aman, menumbuhkan rasa percaya diri, dan mendidik akidah serta akhlak mereka agar menjadi penerus bangsa yang membanggakan."
              </p>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                justifyContent: 'center',
                fontSize: '13px', 
                color: 'var(--color-emerald-800)',
                background: 'var(--bg-light-green)',
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600
              }}>
                <MapPin size={16} /> Rengasdengklok, Karawang
              </div>
            </div>
          </ScrollReveal>

          {/* Sisi Kanan: Deskripsi Sejarah & Prestasi */}
          <ScrollReveal delay={300}>
            <div className="about-text">
              <div className="about-history" style={{ textAlign: 'center' }}>
                <h3 style={{ textAlign: 'center' }}>Sejarah Singkat</h3>
                <p className="about-desc" style={{ textAlign: 'center', lineHeight: '1.75' }}>
                  Didirikan pada tahun {info.foundedYear} di Karawang, <strong>{info.name}</strong> lahir atas kepedulian mendalam terhadap anak-anak yatim piatu yang dipelopori oleh para Pendiri yaitu <strong>KH. Zenal Abidin (Alm)</strong> dan <strong>Ustzh. Hj. Ukhronah (Alm)</strong>.
                  Di bawah kepemimpinan Ketua Yayasan saat ini, <strong>{info.chairman}</strong>, lembaga ini berkembang menjadi salah satu asrama panti asuhan yang dipercaya dan tertib di Kabupaten Karawang.
                </p>
                <p className="about-desc" style={{ textAlign: 'center', lineHeight: '1.75', marginBottom: '32px' }}>
                  Alamat operasional kami berlokasi di <strong>{info.address}</strong>, sebuah tempat asri dan kondusif tempat anak-anak asuh dibekali pendidikan formal sekolah, bimbingan mengaji Al-Qur'an harian, hingga latihan wirausaha kemandirian.
                </p>
              </div>

              {/* List Prestasi */}
              <div className="prestasi-title">
                <Award className="prestasi-icon" size={22} />
                Prestasi & Pengakuan Resmi
              </div>
              <ul className="prestasi-list">
                {achievements.map((item) => (
                  <li key={item.id} className="prestasi-item">
                    <div style={{ 
                      background: 'var(--color-gold-500)', 
                      color: 'var(--color-emerald-950)',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      minWidth: '54px',
                      textAlign: 'center'
                    }}>
                      {item.year}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', fontSize: '15px', color: 'var(--color-emerald-950)' }}>{item.title}</strong>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
