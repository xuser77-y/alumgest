import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL, WA, useLang, useReveal, IconWA, IconZoom } from '../App';

function allImages(project) {
  if (!project) return [];
  const g = Array.isArray(project.galleryImages) ? project.galleryImages : [];
  return [...new Set([project.coverImage, ...g].filter(Boolean))];
}

export default function ProjectDetail() {
  const { id }                  = useParams();
  const { t }                   = useLang();
  const [project,  setProject]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related,  setRelated]  = useState([]);
  const [lightbox, setLightbox] = useState(null);
  useReveal();

  useEffect(() => {
    setLoading(true); setNotFound(false);
    fetch(`${API_URL}/portfolio/${id}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => {
        setProject(d); setLoading(false);
        fetch(`${API_URL}/portfolio?category=${encodeURIComponent(d.category||'')}&limit=4`)
          .then(r => r.json())
          .then(r => setRelated((r.projects||[]).filter(p=>p._id!==id).slice(0,3)))
          .catch(()=>{});
      })
      .catch(() => { setLoading(false); setNotFound(true); });
  }, [id]);

  const imgs = allImages(project);

  const handleKey = useCallback((e) => {
    if (lightbox === null) return;
    if (e.key==='ArrowRight') setLightbox(i=>(i+1)%imgs.length);
    if (e.key==='ArrowLeft')  setLightbox(i=>(i-1+imgs.length)%imgs.length);
    if (e.key==='Escape')     setLightbox(null);
  }, [lightbox, imgs.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (loading) return (
    <div className="detail-loading"><div className="spinner"/></div>
  );

  if (notFound || !project) return (
    <div className="page-wrap">
      <div className="container" style={{ paddingTop:80, paddingBottom:80, textAlign:'center' }}>
        <div style={{ fontSize:56 }}>😕</div>
        <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, margin:'16px 0' }}>
          {t.detail.notFound}
        </h2>
        <Link to="/projects" className="btn-primary" style={{ display:'inline-flex' }}>
          ← {t.detail.back}
        </Link>
      </div>
    </div>
  );

  const infoRows = [
    { label:t.detail.cat,     val:project.category },
    { label:t.detail.loc,     val:project.location  },
    { label:t.detail.year,    val:project.year      },
    { label:t.detail.surface, val:project.surface   },
    { label:t.detail.client,  val:project.client    },
  ].filter(r => r.val);

  return (
    <div>
      {/* HERO */}
      <div className="detail-hero" style={{ marginTop:72 }}>
        {project.coverImage
          ? <img src={project.coverImage} alt={project.title}/>
          : <div className="detail-hero-ph"/>
        }
        <div className="detail-hero-overlay">
          <div className="container">
            <div className="detail-breadcrumb">
              <Link to="/">{t.detail.breadHome}</Link>
              <span>›</span>
              <Link to="/projects">{t.detail.breadProj}</Link>
              <span>›</span>
              <span>{project.title}</span>
            </div>
            <h1 className="detail-title">{project.title}</h1>
            <div className="detail-meta-row">
              {project.category && <span className="detail-cat">{project.category}</span>}
              {project.location && (
                <span className="detail-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {project.location}
                </span>
              )}
              {project.year && (
                <span className="detail-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {project.year}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="container detail-layout">
        <div>
          {/* description */}
          {project.description && (
            <div className="detail-card reveal-card">
              <h2 className="detail-card-title">{t.detail.about}</h2>
              <p className="detail-desc">{project.description}</p>
            </div>
          )}

          {/* gallery */}
          {imgs.length > 0 && (
            <div className="detail-card reveal-card d2">
              <h2 className="detail-card-title">
                {t.detail.gallery}
                <span className="detail-card-count">
                  {imgs.length} {imgs.length === 1 ? t.detail.photo : t.detail.photos}
                </span>
              </h2>
              <div className="detail-gallery">
                {imgs.map((img, i) => (
                  <div key={i} className="detail-gallery-item" onClick={() => setLightbox(i)}>
                    <img src={img} alt={`${project.title} ${i+1}`} loading="lazy"/>
                    <div className="detail-gallery-zoom"><IconZoom/></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="detail-sidebar">
          <div className="detail-info-card reveal-card">
            <div className="detail-info-title">{t.detail.info}</div>
            {infoRows.map(r => (
              <div key={r.label} className="detail-info-row">
                <span className="detail-info-label">{r.label}</span>
                <span className="detail-info-val">{r.val}</span>
              </div>
            ))}
          </div>
          <div className="detail-cta-card reveal-card d2">
            <h3>{t.detail.ctaTitle}</h3>
            <p>{t.detail.ctaText}</p>
            <a
              href={`https://wa.me/${WA}?text=${encodeURIComponent(`Bonjour, je suis intéressé par un projet similaire à "${project.title}"`)}`}
              target="_blank" rel="noreferrer"
              className="btn-wa detail-cta-btn">
              <IconWA/> {t.detail.ctaBtn}
            </a>
          </div>
        </aside>
      </div>

      {/* RELATED */}
      {related.length > 0 && (
        <div style={{ background:'var(--bg2)', borderTop:'1px solid var(--border)', padding:'80px 0' }}>
          <div className="container">
            <h2 className="related-title">{t.detail.related}</h2>
            <div className="projects-grid" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))' }}>
              {related.map(p => (
                <Link key={p._id} to={`/projects/${p._id}`} className="project-card reveal-card">
                  <div className="project-card-img">
                    {p.coverImage
                      ? <img src={p.coverImage} alt={p.title} loading="lazy"/>
                      : <div className="project-card-no-img">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                    }
                    {p.category && <div className="project-card-cat">{p.category}</div>}
                  </div>
                  <div className="project-card-body">
                    <h3 className="project-card-title">{p.title}</h3>
                    <div className="project-card-meta">
                      {p.location && <span>{p.location}</span>}
                      {p.year     && <span>{p.year}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox !== null && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          {imgs.length > 1 && (
            <button className="lightbox-prev"
              onClick={e => { e.stopPropagation(); setLightbox(i=>(i-1+imgs.length)%imgs.length); }}>
              ‹
            </button>
          )}
          <img src={imgs[lightbox]} alt="" className="lightbox-img" onClick={e=>e.stopPropagation()}/>
          {imgs.length > 1 && (
            <button className="lightbox-next"
              onClick={e => { e.stopPropagation(); setLightbox(i=>(i+1)%imgs.length); }}>
              ›
            </button>
          )}
          {imgs.length > 1 && (
            <div className="lightbox-counter">{lightbox+1} / {imgs.length}</div>
          )}
        </div>
      )}
    </div>
  );
}
