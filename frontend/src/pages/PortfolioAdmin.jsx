import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Modal } from 'react-bootstrap';
import {
  Plus, Edit3, Trash2, Eye, EyeOff, Star, StarOff,
  Upload, X, Image, Globe, MapPin, Calendar,
  Tag, User, Maximize2, CheckCircle2, AlertCircle, Search,
} from 'lucide-react';
import api from '../services/api';
import './PortfolioAdmin.css';

const fmt = d =>
  new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' });

/* ─── toast ─── */
const useToast = () => {
  const [list, setList] = useState([]);
  const show = useCallback((msg, ok = true) => {
    const id = Date.now();
    setList(p => [...p, { id, msg, ok }]);
    setTimeout(() => setList(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return { list, show };
};

/* ─── blank form ─── */
const blank = () => ({
  title:'', description:'', location:'', category:'',
  year: new Date().getFullYear(), client:'', surface:'',
  coverImage:'', galleryImages:[],
  isPublished:false, featured:false,
});

const fromProject = p => ({
  title:         p.title         || '',
  description:   p.description   || '',
  location:      p.location      || '',
  category:      p.category      || '',
  year:          p.year          || new Date().getFullYear(),
  client:        p.client        || '',
  surface:       p.surface       || '',
  coverImage:    p.coverImage    || '',
  galleryImages: Array.isArray(p.galleryImages) ? [...p.galleryImages] : [],
  isPublished:   !!p.isPublished,
  featured:      !!p.featured,
});

/* ════════════════════════════════════════════════════════════
   IMAGE UPLOADER
   Uploads to backend, returns URL.
   For multiple: calls onChange(url) for each file.
   Parent is responsible for appending via setForm functional updater.
════════════════════════════════════════════════════════════ */
const ImageUploader = ({ label, value, onChange, multiple = false }) => {
  const inputRef = useRef();
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState({ done:0, total:0 });
  const [err,  setErr]  = useState('');

  const uploadOne = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await api.post('/portfolio/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    if (!res.data?.url) throw new Error('Pas d\'URL retournée');
    return res.data.url;
  };

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setErr(''); setBusy(true);
    setProg({ done:0, total: files.length });
    try {
      for (const file of files) {
        const url = await uploadOne(file);
        onChange(url); // parent decides what to do with each url
        setProg(p => ({ ...p, done: p.done + 1 }));
      }
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Erreur upload');
    } finally {
      setBusy(false);
      setProg({ done:0, total:0 });
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  };

  /* single cover */
  if (!multiple) {
    return (
      <div>
        <div className="pa-label">{label}</div>
        <div className={`pa-zone${value ? ' pa-zone--has' : ''}`}
          onDragOver={e => e.preventDefault()} onDrop={onDrop}
          onClick={() => !value && !busy && inputRef.current?.click()}>
          {busy && <div className="pa-zone-loading"><div className="pa-spin"/><span>Upload…</span></div>}
          {!busy && value && (
            <>
              <img src={value} alt="cover" className="pa-zone-img"/>
              <div className="pa-zone-overlay">
                <button type="button" className="pa-overlay-btn"
                  onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                  <Edit3 size={14}/> Changer
                </button>
                <button type="button" className="pa-overlay-btn danger"
                  onClick={e => { e.stopPropagation(); onChange(''); }}>
                  <X size={14}/> Supprimer
                </button>
              </div>
            </>
          )}
          {!busy && !value && (
            <div className="pa-zone-placeholder">
              <Upload size={30}/>
              <span>Glisser ou cliquer</span>
              <small>JPG · PNG · WebP · max 10MB</small>
            </div>
          )}
        </div>
        {err && <div className="pa-field-error">{err}</div>}
        <input ref={inputRef} type="file" accept="image/*" hidden
          onChange={e => e.target.files[0] && handleFiles([e.target.files[0]])}/>
      </div>
    );
  }

  /* multiple gallery */
  const list = Array.isArray(value) ? value : [];
  return (
    <div>
      <div className="pa-label">
        {label}
        {list.length > 0 && <span style={{ fontWeight:400, opacity:.55, marginLeft:8 }}>({list.length})</span>}
      </div>
      <div className="pa-gallery">
        {list.map((url, i) => (
          <div key={i} className="pa-thumb">
            <img src={url} alt={`img-${i+1}`} loading="lazy"/>
            <button type="button" className="pa-thumb-x"
              onClick={() => onChange({ type:'remove', index:i })}>
              <X size={10}/>
            </button>
          </div>
        ))}
        <div className="pa-gallery-add"
          onDragOver={e => e.preventDefault()} onDrop={onDrop}
          onClick={() => !busy && inputRef.current?.click()}>
          {busy
            ? <><div className="pa-spin small"/><span>{prog.done}/{prog.total}</span></>
            : <><Plus size={22}/><span>Ajouter</span></>
          }
        </div>
      </div>
      {err && <div className="pa-field-error">{err}</div>}
      <div className="pa-gallery-hint">Plusieurs fichiers supportés · glisser-déposer accepté</div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden
        onChange={e => e.target.files.length && handleFiles(Array.from(e.target.files))}/>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   
   KEY DESIGN DECISION:
   The form data lives in a useRef (formRef), NOT in useState.
   This means:
   - No stale closure problem ever — formRef.current is always current
   - We use a separate useState(0) ticker to force re-renders when needed
   - handleSave always reads formRef.current which is always up to date
════════════════════════════════════════════════════════════ */
export default function PortfolioAdmin() {
  const { list: toasts, show } = useToast();

  /* table data */
  const [projects, setProjects] = useState([]);
  const [cats,     setCats]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFlt,   setCatFlt]   = useState('');
  const [pubFlt,   setPubFlt]   = useState('');

  /* modal */
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [tab,       setTab]       = useState('info');
  const [saving,    setSaving]    = useState(false);

  /*
   * THE FIX:
   * Store form in a ref, not state. This means handleSave always
   * reads the latest data — no stale closure, no useEffect timing issue.
   * We use a separate render counter to make React re-render when form changes.
   */
  const formRef  = useRef(blank());
  const [tick, setTick] = useState(0); // increment to trigger re-render
  const form = formRef.current;        // shorthand for reading

  const setForm = (updater) => {
    if (typeof updater === 'function') {
      formRef.current = updater(formRef.current);
    } else {
      formRef.current = updater;
    }
    setTick(t => t + 1); // force re-render
  };

  const sf = (key, val) => setForm(f => ({ ...f, [key]: val }));

  /* delete */
  const [delItem, setDelItem] = useState(null);

  /* load */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set('search',    search);
      if (catFlt) p.set('category',  catFlt);
      if (pubFlt) p.set('published', pubFlt);
      const [rP, rC] = await Promise.all([
        api.get(`/portfolio/admin/all?${p}`),
        api.get('/portfolio/categories'),
      ]);
      setProjects(rP.data);
      setCats(rC.data || []);
    } catch { show('Erreur de chargement', false); }
    setLoading(false);
  }, [search, catFlt, pubFlt]);

  useEffect(() => { load(); }, [load]);

  /* open create */
  const openCreate = () => {
    setEditId(null);
    formRef.current = blank();
    setTab('info');
    setShowModal(true);
    setTick(t => t + 1);
  };

  /* open edit — fetch full project so description + gallery are included */
  const openEdit = async (p) => {
    setEditId(p._id);
    setTab('info');
    formRef.current = fromProject(p);
    setShowModal(true);
    setTick(t => t + 1);
    try {
      const r = await api.get(`/portfolio/${p._id}`);
      formRef.current = fromProject(r.data);
      setTick(t => t + 1);
    } catch (e) {
      console.error('fetch full project failed:', e);
    }
  };

  /* save — reads formRef.current which is ALWAYS the latest value */
  const handleSave = async () => {
    const data = formRef.current; // guaranteed fresh, no closure issue
    if (!data.title.trim()) { show('Le titre est requis', false); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/portfolio/${editId}`, data);
        show('Projet modifié !');
      } else {
        await api.post('/portfolio', data);
        show('Projet créé !');
      }
      setShowModal(false);
      load();
    } catch (e) {
      show(e.response?.data?.message || 'Erreur sauvegarde', false);
    }
    setSaving(false);
  };

  /* delete */
  const handleDelete = async () => {
    if (!delItem) return;
    try {
      await api.delete(`/portfolio/${delItem._id}`);
      show('Projet supprimé');
      setDelItem(null);
      load();
    } catch { show('Erreur suppression', false); }
  };

  /* toggle publish / featured */
  const togglePublish = async (p) => {
    try {
      const r = await api.patch(`/portfolio/${p._id}/publish`);
      setProjects(prev => prev.map(x =>
        x._id === p._id ? { ...x, isPublished: r.data.isPublished } : x
      ));
      show(r.data.isPublished ? 'Publié !' : 'Dépublié');
    } catch { show('Erreur', false); }
  };

  const toggleFeatured = async (p) => {
    try {
      const r = await api.patch(`/portfolio/${p._id}/featured`);
      setProjects(prev => prev.map(x =>
        x._id === p._id ? { ...x, featured: r.data.featured } : x
      ));
      show(r.data.featured ? 'Mis en avant !' : 'Retiré');
    } catch { show('Erreur', false); }
  };

  /*
   * Gallery onChange handler.
   * ImageUploader calls onChange(url) for each uploaded file,
   * or onChange({type:'remove', index:i}) to remove.
   * We handle both cases here and write directly to formRef.
   */
  const onGalleryChange = (msg) => {
    if (typeof msg === 'string') {
      // new URL uploaded — append
      formRef.current = {
        ...formRef.current,
        galleryImages: [...(formRef.current.galleryImages || []), msg],
      };
    } else if (msg?.type === 'remove') {
      formRef.current = {
        ...formRef.current,
        galleryImages: (formRef.current.galleryImages || []).filter((_, i) => i !== msg.index),
      };
    }
    setTick(t => t + 1);
  };

  const onCoverChange = (val) => {
    formRef.current = { ...formRef.current, coverImage: val };
    setTick(t => t + 1);
  };

  const pub     = projects.filter(p => p.isPublished).length;
  const featCnt = projects.filter(p => p.featured).length;

  return (
    <Container fluid className="py-4 pa-page">

      {/* TOASTS */}
      <div className="pa-toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`pa-toast ${t.ok ? 'ok' : 'err'}`}>
            {t.ok ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
            {t.msg}
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="pa-header">
        <div>
          <h1 className="pa-title">PORTFOLIO <em>SITE WEB</em></h1>
          <p className="pa-sub">Gestion des projets publics</p>
        </div>
        <div className="pa-header-actions">
          <a href="/" target="_blank" rel="noreferrer" className="pa-btn-ghost">
            <Globe size={14}/> Voir le site
          </a>
          <button className="pa-btn-primary" onClick={openCreate}>
            <Plus size={15}/> Nouveau projet
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="pa-kpi-strip">
        {[
          { l:'Total',       v: projects.length,       c:'#4fa3ff' },
          { l:'Publiés',     v: pub,                   c:'#1db87a' },
          { l:'Brouillons',  v: projects.length - pub, c:'#f0a81a' },
          { l:'En avant',    v: featCnt,                c:'#7c5cf4' },
        ].map(k => (
          <div key={k.l} className="pa-kpi">
            <div className="pa-kpi-val" style={{ color:k.c }}>{k.v}</div>
            <div className="pa-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="pa-filters">
        <div className="pa-search">
          <Search size={14}/>
          <input placeholder="Chercher…" value={search}
            onChange={e => setSearch(e.target.value)}/>
        </div>
        <input className="pa-sel" list="pa-cats-flt" placeholder="Catégorie…"
          value={catFlt} onChange={e => setCatFlt(e.target.value)} style={{ width:160 }}/>
        <datalist id="pa-cats-flt">
          {cats.map(c => <option key={c} value={c}/>)}
        </datalist>
        <select className="pa-sel" value={pubFlt} onChange={e => setPubFlt(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="true">Publiés</option>
          <option value="false">Brouillons</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="pa-table-wrap">
        {loading ? (
          <div className="pa-center-box"><div className="pa-spin"/></div>
        ) : projects.length === 0 ? (
          <div className="pa-center-box" style={{ flexDirection:'column', gap:14 }}>
            <Image size={44} style={{ opacity:.3 }}/>
            <span>Aucun projet trouvé</span>
            <button className="pa-btn-primary" onClick={openCreate}>
              <Plus size={14}/> Créer le premier
            </button>
          </div>
        ) : (
          <table className="pa-table">
            <thead>
              <tr>
                <th>PROJET</th><th>CATÉGORIE</th><th>LOCALISATION</th>
                <th>ANNÉE</th><th>STATUT</th><th>EN AVANT</th>
                <th style={{ textAlign:'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p._id}>
                  <td>
                    <div className="pa-proj-cell">
                      <div className="pa-proj-thumb">
                        {p.coverImage ? <img src={p.coverImage} alt={p.title}/> : <Image size={16}/>}
                      </div>
                      <div>
                        <div className="pa-proj-name">{p.title}</div>
                        <div className="pa-proj-date">{fmt(p.createdAt)}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="pa-cat-badge">{p.category || '—'}</span></td>
                  <td className="pa-td-muted">{p.location || '—'}</td>
                  <td className="pa-td-bold">{p.year || '—'}</td>
                  <td>
                    <button className={`pa-status-btn${p.isPublished ? ' pub' : ' draft'}`}
                      onClick={() => togglePublish(p)}>
                      {p.isPublished ? <><Eye size={11}/> Publié</> : <><EyeOff size={11}/> Brouillon</>}
                    </button>
                  </td>
                  <td>
                    <button className={`pa-icon-btn${p.featured ? ' starred' : ''}`}
                      onClick={() => toggleFeatured(p)}>
                      {p.featured ? <Star size={14} fill="currentColor"/> : <StarOff size={14}/>}
                    </button>
                  </td>
                  <td>
                    <div className="pa-actions">
                      <button className="pa-icon-btn" onClick={() => openEdit(p)} title="Modifier">
                        <Edit3 size={14}/>
                      </button>
                      <button className="pa-icon-btn danger" onClick={() => setDelItem(p)} title="Supprimer">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      <Modal
        key={editId || 'new'}
        show={showModal}
        onHide={() => setShowModal(false)}
        centered size="xl"
        contentClassName="pa-modal-content"
      >
        <div className="pa-modal-hd">
          <h2 className="pa-modal-title">
            {editId ? '✏️ MODIFIER LE PROJET' : '➕ NOUVEAU PROJET'}
          </h2>
          <button type="button" className="pa-icon-btn" onClick={() => setShowModal(false)}>
            <X size={16}/>
          </button>
        </div>

        <div className="pa-modal-tabs">
          {[{id:'info',icon:'📋',label:'Informations'},{id:'images',icon:'🖼',label:'Images'}].map(t => (
            <button key={t.id} type="button"
              className={`pa-modal-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
          <div className="pa-toggles">
            <label className="pa-toggle">
              <input type="checkbox" checked={form.isPublished}
                onChange={e => sf('isPublished', e.target.checked)}/>
              <span className="pa-toggle-track"><span className="pa-toggle-thumb"/></span>
              <span>Publié</span>
            </label>
            <label className="pa-toggle">
              <input type="checkbox" checked={form.featured}
                onChange={e => sf('featured', e.target.checked)}/>
              <span className="pa-toggle-track gold"><span className="pa-toggle-thumb"/></span>
              <span>En avant</span>
            </label>
          </div>
        </div>

        <div className="pa-modal-body">

          {/* INFO tab — display:none keeps DOM alive, no state loss */}
          <div style={{ display: tab === 'info' ? 'block' : 'none' }}>
            <Row className="g-3">
              <Col md={12}>
                <div className="pa-field">
                  <label>TITRE DU PROJET *</label>
                  <input value={form.title}
                    onChange={e => sf('title', e.target.value)}
                    placeholder="Ex: Villa Résidentielle Agadir"/>
                </div>
              </Col>
              <Col md={12}>
                <div className="pa-field">
                  <label>DESCRIPTION</label>
                  <textarea rows={5} value={form.description}
                    onChange={e => sf('description', e.target.value)}
                    placeholder="Décrivez le projet, matériaux, contexte…"/>
                </div>
              </Col>
              <Col md={6}>
                <div className="pa-field">
                  <label><MapPin size={10}/> LOCALISATION</label>
                  <input value={form.location}
                    onChange={e => sf('location', e.target.value)}
                    placeholder="Agadir, Maroc"/>
                </div>
              </Col>
              <Col md={6}>
                <div className="pa-field">
                  <label><Tag size={10}/> CATÉGORIE</label>
                  <input list="pa-cats-form" value={form.category}
                    onChange={e => sf('category', e.target.value)}
                    placeholder="Ex: Résidentiel, Commercial…"/>
                  <datalist id="pa-cats-form">
                    {cats.map(c => <option key={c} value={c}/>)}
                  </datalist>
                </div>
              </Col>
              <Col md={4}>
                <div className="pa-field">
                  <label><Calendar size={10}/> ANNÉE</label>
                  <input type="number" min="1990" max="2035"
                    value={form.year} onChange={e => sf('year', e.target.value)}/>
                </div>
              </Col>
              <Col md={4}>
                <div className="pa-field">
                  <label><User size={10}/> CLIENT</label>
                  <input value={form.client}
                    onChange={e => sf('client', e.target.value)}
                    placeholder="Nom du client"/>
                </div>
              </Col>
              <Col md={4}>
                <div className="pa-field">
                  <label><Maximize2 size={10}/> SURFACE</label>
                  <input value={form.surface}
                    onChange={e => sf('surface', e.target.value)}
                    placeholder="Ex: 240 m²"/>
                </div>
              </Col>
            </Row>
          </div>

          {/* IMAGES tab — display:none keeps DOM alive */}
          <div style={{ display: tab === 'images' ? 'block' : 'none' }}>
            <Row className="g-4">
              <Col md={5}>
                <ImageUploader
                  label="IMAGE DE COUVERTURE"
                  value={form.coverImage}
                  onChange={onCoverChange}
                />
              </Col>
              <Col md={7}>
                <ImageUploader
                  label="GALERIE D'IMAGES"
                  value={form.galleryImages}
                  onChange={onGalleryChange}
                  multiple
                />
              </Col>
            </Row>
          </div>

        </div>

        <div className="pa-modal-ft">
          <button type="button" className="pa-btn-ghost" onClick={() => setShowModal(false)}>
            Annuler
          </button>
          {tab === 'info' && (
            <button type="button" className="pa-btn-ghost" onClick={() => setTab('images')}>
              Images →
            </button>
          )}
          <button type="button" className="pa-btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><div className="pa-spin small"/> Sauvegarde…</>
              : <><CheckCircle2 size={14}/> {editId ? 'Sauvegarder' : 'Créer le projet'}</>
            }
          </button>
        </div>
      </Modal>

      {/* DELETE */}
      <Modal show={!!delItem} onHide={() => setDelItem(null)} centered size="sm"
        contentClassName="pa-modal-content">
        <div className="pa-del-body">
          <Trash2 size={48} className="pa-del-icon"/>
          <h4 className="pa-del-title">Supprimer le projet ?</h4>
          <p className="pa-del-name">"{delItem?.title}"</p>
          <p className="pa-del-warn">Images supprimées de Cloudinary. Action irréversible.</p>
          <div className="pa-del-btns">
            <button type="button" className="pa-btn-ghost" onClick={() => setDelItem(null)}>Annuler</button>
            <button type="button" className="pa-btn-danger" onClick={handleDelete}>
              <Trash2 size={13}/> Supprimer
            </button>
          </div>
        </div>
      </Modal>

    </Container>
  );
}