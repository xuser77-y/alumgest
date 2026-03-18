import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, WA, useLang, IconWA, IconArrow, IconCheck } from '../App';

const ICONS = {
  window: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>,
  door:   <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 21h18M9 21V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v16"/><circle cx="15.5" cy="13" r=".5" fill="currentColor"/></svg>,
  facade: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  draft:  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  shield: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  star:   <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};
const SICONS = [ICONS.window, ICONS.door, ICONS.facade, ICONS.draft, ICONS.shield, ICONS.star];

const TESTI_IMGS = ['K','A','M'];

export default function Home() {
  const { t, lang } = useLang();
  const [featured,  setFeatured]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [testimons, setTestimons] = useState([]);
  const [form,      setForm]      = useState({ name:'', role:'', text:'', stars:5 });
  const [submitting,setSubmitting]= useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/portfolio?featured=true&limit=6`)
        .then(r => r.json()).catch(() => ({ projects:[], total:0 })),
      fetch(`${API_URL}/portfolio?limit=6`)
        .then(r => r.json()).catch(() => ({ projects:[], total:0 })),
      fetch(`${API_URL}/testimonials`)
        .then(r => r.json()).catch(() => []),
    ]).then(([feat, all, testi]) => {
      const featProjects = feat.projects || [];
      setFeatured(featProjects.length > 0 ? featProjects : (all.projects || []));
      setTotal(all.total || 0);
      setTestimons(Array.isArray(testi) ? testi : []);
      setLoading(false);
    });
  }, []);

  /* Re-scan reveal elements after async data renders */
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => window.dispatchEvent(new Event('gjw-rescan')), 60);
      return () => clearTimeout(t);
    }
  }, [loading, featured]);

  const handleSubmitTesti = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/testimonials`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {}
    setSubmitting(false);
  };

  const displayTestis = testimons.length > 0 ? testimons : t.testi;

  return (
    <>
      {/* ════ HERO ════ */}
      <section className="hero">
        <div className="hero-bg"/>
        <div className="hero-inner">
          {/* LEFT */}
          <div style={{ animation:'fadeUp .7s ease both' }}>
            <div className="hero-tag">
              <span className="hero-tag-dot"/>
              {t.hero.tag}
            </div>
            <h1 className="hero-title">
              {t.hero.t1}<br/>
              <span>{t.hero.t2}</span><br/>
              {t.hero.t3}
            </h1>
            <p className="hero-sub">{t.hero.sub}</p>
            <div className="hero-btns">
              <Link to="/projects" className="btn-primary">
                {t.hero.btn1} <IconArrow/>
              </Link>
              <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" className="btn-wa">
                <IconWA/> {t.hero.btn2}
              </a>
            </div>
            <div className="hero-trust">
              <div className="hero-trust-avs">
                {TESTI_IMGS.map((l,i) => (
                  <div key={i} className="hero-trust-av" style={{ zIndex:3-i }}>{l}</div>
                ))}
              </div>
              <div>
                <div className="hero-trust-n">+200 {t.hero.trust}</div>
                <div className="hero-trust-s">⭐⭐⭐⭐⭐ {t.hero.trustSub}</div>
              </div>
            </div>
          </div>

          {/* RIGHT floating composition */}
          <div className="hero-visual">
            <img
              src="https://scontent.frak4-1.fna.fbcdn.net/v/t39.30808-6/645607794_1401512108654996_6698566937836519557_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=TiFTV0KYYsAQ7kNvwGJ2Zf0&_nc_oc=AdkkktpoG88VF4Ma1ltr9tOi7aGeuyOCXTZda7ciG5EUFEPMShyLGF6kNBgp5e7PFyg&_nc_zt=23&_nc_ht=scontent.frak4-1.fna&_nc_gid=jCotKxqtjDR6r_rAYxyOOg&_nc_ss=8&oh=00_AfymJcqMsPU3gpTRxMupWXDeYKFJ2gOBHf3NuC-DJw89sw&oe=69C0954B"
              alt="Réalisation Gil Jakan" className="hero-img-main"
            />
            <div className="hero-float-card">
              <div className="hero-float-label">{t.hero.cardLbl}</div>
              <div className="hero-float-val">500+</div>
              <div className="hero-float-sub">{t.hero.cardSub}</div>
            </div>
            <div className="hero-float-card2">
              <div className="hero-float-card2-icon">🏆</div>
              <div className="hero-float-card2-text">{t.hero.card2}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ STATS ════ */}
      <div className="stats-band">
        <div className="container">
          <div className="stats-grid">
            {[
              { n:'15+', l:t.hero.s1 },
              { n:'500+', l:t.hero.s2 },
              { n:'200+', l:t.hero.s3 },
              { n:'100%', l:lang==='ar'?'رضا العملاء':'Satisfaction client' },
            ].map(s => (
              <div key={s.l} className="stat-item">
                <div className="stat-num">{s.n}</div>
                <div className="stat-lbl">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════ SERVICES ════ */}
      <section className="section" style={{ background:'var(--bg2)' }}>
        <div className="container">
          <div className="section-header center reveal">
            <div className="label-tag">{t.home.servTag}</div>
            <h2 className="section-title">{t.home.servTitle} <em>{t.home.servTitleEm}</em></h2>
            <p className="section-sub">{t.home.servSub}</p>
          </div>
          <div className="services-grid">
            {t.services.map((s, i) => (
              <div key={i} className={`service-card reveal d${(i%4)+1}`}>
                <div className="service-icon">{SICONS[i]}</div>
                <div className="service-title">{s.title}</div>
                <div className="service-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FEATURED PROJECTS ════ */}
      <section className="section">
        <div className="container">
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:52 }}>
            <div className="reveal">
              <div className="label-tag">{t.home.portTag}</div>
              <h2 className="section-title">{t.home.portTitle} <em>{t.home.portTitleEm}</em></h2>
            </div>
            <Link to="/projects" className="btn-ghost reveal d2">
              {t.home.viewAll} <IconArrow/>
            </Link>
          </div>

          {loading ? (
            <div className="loading-grid">
              {[...Array(3)].map((_, i) => <div key={i} className="card-skeleton"/>)}
            </div>
          ) : featured.length === 0 ? (
            <div className="empty-state">{t.home.noProj}</div>
          ) : (
            <div className="projects-grid">
              {featured.map((p, i) => (
                <Link key={p._id} to={`/projects/${p._id}`}
                  className={`project-card reveal-card d${(i%3)+1}`}>
                  <div className="project-card-img">
                    {p.coverImage
                      ? <img src={p.coverImage} alt={p.title} loading="lazy"/>
                      : <div className="project-card-no-img">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                    }
                    {p.category && <div className="project-card-cat">{p.category}</div>}
                  </div>
                  <div className="project-card-body">
                    <h3 className="project-card-title">{p.title}</h3>
                    <div className="project-card-meta">
                      {p.location && (
                        <span className="project-card-meta-item">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {p.location}
                        </span>
                      )}
                      {p.year && (
                        <span className="project-card-meta-item">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {p.year}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="project-card-desc">
                        {p.description.slice(0, 110)}{p.description.length > 110 ? '…' : ''}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════ WHY US ════ */}
      <section className="section" style={{ background:'var(--bg2)' }}>
        <div className="container">
          <div className="why-grid">
            <div className="why-img-wrap reveal">
              <img src="https://scontent.frak4-1.fna.fbcdn.net/v/t39.30808-6/490064280_1128735932599283_5734412845824748085_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=7b2446&_nc_ohc=crJiuASfkZEQ7kNvwGaemED&_nc_oc=Adka3BW-7mCsCpUhXvUSkkHNGrE4sBnL3VgIaZy1_MSn19imlTRjcJBH52BCP-dxEo0&_nc_zt=23&_nc_ht=scontent.frak4-1.fna&_nc_gid=aKCtstlmLQfM9LKoB4dn5Q&_nc_ss=8&oh=00_AfxMDECT413qJX0ToZ3hvQ4vBHx2CxEw1hPURhpFm0ymMw&oe=69C090F4"
                alt="Atelier Gil Jakan" loading="lazy"/>
              <div className="why-img-badge">
                <div className="why-img-badge-n">15+</div>
                <div className="why-img-badge-l">{lang==='ar'?'سنة خبرة':'ans d\'expérience'}</div>
              </div>
            </div>
            <div className="reveal d2">
              <div className="label-tag">{t.home.whyTag}</div>
              <h2 className="section-title">{t.home.whyTitle} <em>{t.home.whyTitleEm}</em></h2>
              <p className="section-sub">{t.home.whySub}</p>
              <div className="why-checks">
                {t.home.whyChecks.map(c => (
                  <div key={c} className="why-check">
                    <div className="why-check-icon">✓</div>
                    {c}
                  </div>
                ))}
              </div>
              <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" className="btn-wa">
                <IconWA/> {t.home.contact}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════ TESTIMONIALS ════ */}
      <section className="section">
        <div className="container">
          <div className="section-header center reveal">
            <div className="label-tag">{t.home.testiTag}</div>
            <h2 className="section-title">{t.home.testiTitle} <em>{t.home.testiTitleEm}</em></h2>
          </div>
          <div className="testi-grid">
            {displayTestis.map((tst, i) => (
              <div key={tst._id || i} className={`testi-card reveal-card d${i+1}`}>
                <div className="testi-quote-mark">"</div>
                <div className="testi-stars">
                  {Array.from({length: tst.stars || 5}).map((_,j) => <span key={j}>★</span>)}
                </div>
                <p className="testi-text">{tst.text}</p>
                <div className="testi-author">
                  <div className="testi-avatar">{tst.name[0]}</div>
                  <div>
                    <div className="testi-name">{tst.name}</div>
                    <div className="testi-role">{tst.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── SUBMIT YOUR REVIEW ── */}
          <div style={{ marginTop:56, maxWidth:580, margin:'56px auto 0' }}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div className="label-tag" style={{ justifyContent:'center' }}>
                {lang==='ar' ? 'شاركنا رأيك' : 'Laissez votre avis'}
              </div>
              <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:800, color:'var(--text)' }}>
                {lang==='ar' ? 'كيف كانت تجربتك معنا؟' : 'Quelle a été votre expérience ?'}
              </h3>
            </div>
            {submitted ? (
              <div style={{ textAlign:'center', padding:32, background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:14 }}>
                <div style={{ fontSize:32, marginBottom:10 }}>✅</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color:'var(--text)' }}>
                  {lang==='ar' ? 'شكراً! سنراجع رأيك قريباً.' : 'Merci ! Votre avis sera examiné.'}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitTesti} style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:14, padding:28, display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--dim)', marginBottom:5, display:'block' }}>
                      {lang==='ar' ? 'الاسم *' : 'Votre nom *'}
                    </label>
                    <input required style={{ width:'100%', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, padding:'10px 13px', color:'var(--text)', fontFamily:'inherit', fontSize:13, outline:'none' }}
                      placeholder={lang==='ar' ? 'محمد علمي' : 'Mohammed Alami'}
                      value={form.name} onChange={e => sf('name', e.target.value)}/>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--dim)', marginBottom:5, display:'block' }}>
                      {lang==='ar' ? 'الدور / الشركة' : 'Rôle / Entreprise'}
                    </label>
                    <input style={{ width:'100%', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, padding:'10px 13px', color:'var(--text)', fontFamily:'inherit', fontSize:13, outline:'none' }}
                      placeholder={lang==='ar' ? 'مقاول' : 'Promoteur'}
                      value={form.role} onChange={e => sf('role', e.target.value)}/>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--dim)', marginBottom:5, display:'block' }}>
                    {lang==='ar' ? 'رأيك *' : 'Votre avis *'}
                  </label>
                  <textarea required rows={3} style={{ width:'100%', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, padding:'10px 13px', color:'var(--text)', fontFamily:'inherit', fontSize:13, outline:'none', resize:'vertical' }}
                    placeholder={lang==='ar' ? 'شارك تجربتك…' : 'Décrivez votre expérience…'}
                    value={form.text} onChange={e => sf('text', e.target.value)}/>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <label style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--dim)' }}>
                    {lang==='ar' ? 'التقييم' : 'Note'}
                  </label>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button"
                      onClick={() => sf('stars', n)}
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color: n <= form.stars ? '#f59e0b' : 'var(--dim2)', padding:2, transition:'color .15s' }}>
                      ★
                    </button>
                  ))}
                </div>
                <button type="submit" className="btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={submitting}>
                  {submitting
                    ? (lang==='ar' ? 'جارٍ الإرسال…' : 'Envoi en cours…')
                    : (lang==='ar' ? 'إرسال الرأي' : 'Envoyer mon avis')
                  }
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ════ CTA BAND ════ */}
      <section className="cta-band">
        <div className="container">
          <h2 className="cta-title">{t.home.ctaTitle}</h2>
          <p className="cta-sub">{t.home.ctaSub}</p>
          <div className="cta-btns">
            <Link to="/contact" className="cta-btn-white">
              <IconCheck/> {t.home.ctaBtn1}
            </Link>
            <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" className="cta-btn-outline">
              <IconWA/> {t.home.ctaBtn2}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}