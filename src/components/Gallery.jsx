import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Camera } from 'lucide-react';
import { galleryList as staticGallery } from '../data/mockData';
import ScrollReveal from './ScrollReveal';

export default function Gallery() {
  const [gallery, setGallery] = useState(staticGallery);
  const [filter, setFilter] = useState('Semua');

  const categories = ['Semua', 'Minggu Ceria', 'Tadabur Alam', 'Ramadhan', 'Lebaran Yatim'];

  useEffect(() => {
    fetch('/api/gallery')
      .then(res => {
        if (!res.ok) throw new Error('Offline');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setGallery(data);
        }
      })
      .catch(() => console.log('Menggunakan galeri foto bawaan (statis).'));
  }, []);

  const filteredItems = filter === 'Semua' 
    ? gallery 
    : gallery.filter(item => item.category === filter);

  return (
    <section id="galeri" className="section-padding">
      <div className="container">
        {/* Section Title */}
        <ScrollReveal>
          <div className="text-center">
            <span className="section-badge">Dokumentasi</span>
            <h2 className="section-title serif-title">Galeri Senyum Anak-Anak</h2>
            <p className="section-subtitle">
              Momen-momen indah kebersamaan, tawa, pembelajaran, dan rekreasi anak-anak panti asuhan Nurul Aitam Karawang yang terekam kamera.
            </p>
          </div>
        </ScrollReveal>

        {/* Filter Buttons */}
        <ScrollReveal delay={100}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '40px'
          }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-outline'}`}
                style={{ 
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 600,
                  boxShadow: filter === cat ? 'var(--shadow-sm)' : 'none'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Gallery Grid */}
        <div className="gallery-grid">
          {filteredItems.map((item, index) => (
            <ScrollReveal key={item.id} delay={(index % 4) * 100}>
              <div className="gallery-card">
                <img src={item.image} alt={item.title} />
                <div className="gallery-overlay">
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: 'var(--color-gold-300)',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      {item.category}
                    </span>
                    <h4 className="gallery-title">{item.title}</h4>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
        
        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Camera size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>Tidak ada dokumentasi foto untuk kategori ini.</p>
          </div>
        )}
      </div>
    </section>
  );
}
