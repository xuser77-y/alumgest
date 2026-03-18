import React, { useState } from 'react';
import { API_URL, WA, useLang, useReveal, IconWA, IconPhone, IconMail, IconMapPin, IconClock, IconCheck } from '../App';

export default function Contact() {
  const { t } = useLang();
  const [form,      setForm]      = useState({ name:'', email:'', phone:'', message:'' });
  const [sending,   setSending]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');
  useReveal();

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true); setError('');
    try {
      const r = await fetch(`${API_URL}/website/contact`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error('Erreur');
      setSubmitted(true);
    } catch {
      setError(t.contact.error);
    }
    setSending(false);
  };

  const INFO = [
    { icon:<IconMapPin/>, label:t.contact.addr,  val:t.footer?.addr || 'Zone Industrielle, Agadir', href:null },
    { icon:<IconPhone/>,  label:t.contact.phone, val:'+212 6 00 00 00 00', href:'tel:+212600000000' },
    { icon:<IconMail/>,   label:t.contact.email, val:'contact@giljakan.ma', href:'mailto:contact@giljakan.ma' },
    { icon:<IconClock/>,  label:t.contact.hours, val:t.footer?.hours || 'Lun–Sam : 8h–18h', href:null },
  ];

  return (
    <div className="page-wrap">
      {/* PAGE HERO */}
      <div className="page-hero">
        <div className="container">
          <div className="page-hero-content">
            <div className="label-tag">{t.contact.tag}</div>
            <h1 className="page-hero-title">{t.contact.title} <em style={{ color:'var(--brand)', fontStyle:'normal' }}>{t.contact.titleEm}</em></h1>
            <p className="page-hero-sub">{t.contact.sub}</p>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="contact-layout">
            {/* INFO */}
            <div className="reveal">
              <h2 className="contact-info-title">{t.contact.infoTitle}</h2>
              {INFO.map(i => (
                <div key={i.label} className="contact-row">
                  <div className="contact-icon">{i.icon}</div>
                  <div>
                    <div className="contact-label">{i.label}</div>
                    {i.href
                      ? <a href={i.href} className="contact-val">{i.val}</a>
                      : <div className="contact-val">{i.val}</div>
                    }
                  </div>
                </div>
              ))}
              <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer"
                className="btn-wa" style={{ display:'inline-flex', marginTop:24 }}>
                <IconWA/> {t.contact.waBtn}
              </a>
              <div className="contact-note">{t.contact.waNote}</div>
            </div>

            {/* FORM */}
            <div className="contact-form-wrap reveal d2">
              {submitted ? (
                <div className="contact-success">
                  <div className="contact-success-icon">✓</div>
                  <h3>{t.contact.successTitle}</h3>
                  <p>{t.contact.successSub}</p>
                </div>
              ) : (
                <>
                  <h2 className="contact-form-title">{t.contact.formTitle}</h2>
                  {error && <div className="form-error">{error}</div>}
                  <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>{t.contact.name}</label>
                        <input required value={form.name}
                          onChange={e => set('name', e.target.value)}
                          placeholder={t.contact.namePh}/>
                      </div>
                      <div className="form-group">
                        <label>{t.contact.emailF}</label>
                        <input type="email" value={form.email}
                          onChange={e => set('email', e.target.value)}
                          placeholder={t.contact.emailPh}/>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>{t.contact.phoneF}</label>
                      <input required value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        placeholder={t.contact.phonePh}/>
                    </div>
                    <div className="form-group">
                      <label>{t.contact.msg}</label>
                      <textarea required rows={5} value={form.message}
                        onChange={e => set('message', e.target.value)}
                        placeholder={t.contact.msgPh}/>
                    </div>
                    <button type="submit" className="btn-primary form-submit" disabled={sending}>
                      {sending ? t.contact.sending : t.contact.send}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}