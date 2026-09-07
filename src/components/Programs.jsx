import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { programsList as staticPrograms } from '../data/mockData';
import ScrollReveal from './ScrollReveal';

export default function Programs() {
  const [programs, setPrograms] = useState(staticPrograms);

  useEffect(() => {
    fetch('/api/programs')
      .then(res => {
        if (!res.ok) throw new Error('Offline');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPrograms(data);
        }
      })
      .catch(() => console.log('Menggunakan program asuhan bawaan (statis).'));
  }, []);

  return (
    <section id="program" className="section-padding" style={{ backgroundColor: 'white' }}>
      <div className="container">
        {/* Section Title */}
        <ScrollReveal>
          <div className="text-center">
            <span className="section-badge">Program Kerja</span>
            <h2 className="section-title serif-title">Program Kebahagiaan Anak Yatim</h2>
            <p className="section-subtitle">
              Kami mendedikasikan waktu dan tenaga untuk menyusun agenda kegiatan berkelanjutan yang diorientasikan pada kebahagiaan mental, jasmani, dan bekal masa depan mereka.
            </p>
          </div>
        </ScrollReveal>

        {/* Programs Grid */}
        <div className="programs-grid">
          {programs.map((prog, index) => (
            <ScrollReveal key={prog.id} delay={index * 150}>
              <div className="program-card" style={{ height: '100%' }}>
                <img src={prog.image} alt={prog.title} className="program-img" />
                <div className="program-body">
                  <span className="program-schedule">
                    <Calendar size={14} /> {prog.schedule}
                  </span>
                  <h3 className="program-title">{prog.title}</h3>
                  <p className="program-desc">{prog.desc}</p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-emerald-800)',
                    borderTop: '1px solid #f3f6f4',
                    paddingTop: '16px',
                    marginTop: 'auto'
                  }}>
                    <BookOpen size={14} />
                    Program Resmi Yayasan
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
