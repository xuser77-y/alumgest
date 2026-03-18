import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, useLang, useReveal, IconSearch } from '../App';

const LIMIT = 9;

export default function Projects() {
  const { t } = useLang();
  const [projects,   setProjects]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('all');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  useReveal();

  useEffect(() => {
    fetch(`${API_URL}/portfolio/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (catFilter !== 'all') params.append('category', catFilter);
    fetch(`${API_URL}/portfolio?${params}`)
      .then(r => r.json())
      .then(d => {
        setProjects(d.projects || []);
        setTotalPages(d.pages || 1);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [catFilter, page]);

  const shown = search.trim()
    ? projects.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.location || '').toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  const handleCat = (cat) => { setCatFilter(cat); setPage(1); };

  return (
    <div className="page-wrap">
      {/* PAGE HERO */}
      <div className="page-hero">
        <div className="container">
          <div className="page-hero-content">
            <div className="label-tag">{t.projects.tag}</div>
            <h1 className="page-hero-title">{t.projects.title}</h1>
            <p className="page-hero-sub">{t.projects.sub}</p>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* TOOLBAR */}
          <div className="proj-toolbar">
            <div className="proj-search">
              <IconSearch/>
              <input
                placeholder={t.projects.search}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="proj-cats">
              <button
                className={`cat-btn${catFilter === 'all' ? ' active' : ''}`}
                onClick={() => handleCat('all')}>
                {t.projects.all}
              </button>
              {categories.map(c => (
                <button key={c}
                  className={`cat-btn${catFilter === c ? ' active' : ''}`}
                  onClick={() => handleCat(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* GRID */}
          {loading ? (
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => <div key={i} className="card-skeleton"/>)}
            </div>
          ) : shown.length === 0 ? (
            <div className="empty-state">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <div>{t.projects.noResult}</div>
            </div>
          ) : (
            <>
              <div className="projects-grid">
                {shown.map((p, i) => (
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
                    </div>
                  </Link>
                ))}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>←</button>
                  <span className="page-info">{page} / {totalPages}</span>
                  <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>→</button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}