import React, { useState, useEffect } from 'react';
import { FileText, ArrowRight, MessageSquare } from 'lucide-react';
import { articlesList as staticArticles } from '../data/mockData';
import ScrollReveal from './ScrollReveal';

export default function Articles() {
  const [articles, setArticles] = useState(staticArticles);

  useEffect(() => {
    fetch('/api/articles')
      .then(res => {
        if (!res.ok) throw new Error('Offline');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
        }
      })
      .catch(() => console.log('Menggunakan artikel berita bawaan (statis).'));
  }, []);

  return (
    <section id="artikel" className="section-padding" style={{ backgroundColor: 'white' }}>
      <div className="container">
        {/* Section Title */}
        <ScrollReveal>
          <div className="text-center">
            <span className="section-badge">Dakwah & Kabar</span>
            <h2 className="section-title serif-title">Artikel & Berita Terbaru</h2>
            <p className="section-subtitle">
              Kumpulan refleksi dakwah sosial, pentingnya menyantuni anak yatim, serta pembaruan kabar kegiatan panti asuhan Nurul Aitam Karawang.
            </p>
          </div>
        </ScrollReveal>

        {/* Articles Grid */}
        <div className="articles-grid">
          {articles.map((art, index) => (
            <ScrollReveal key={art.id} delay={index * 150}>
              <div className="article-card" style={{ height: '100%' }}>
                <div className="article-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: 'var(--color-emerald-700)', 
                      background: 'rgba(15, 81, 50, 0.06)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {art.category}
                    </span>
                    <span className="article-meta">{art.date}</span>
                  </div>
                  <h3 className="article-title">{art.title}</h3>
                  <p className="article-desc">{art.desc}</p>
                  
                  <a href={art.link || '#'} className="article-link" onClick={(e) => e.preventDefault()}>
                    Baca Selengkapnya <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
