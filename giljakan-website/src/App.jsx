import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home          from './pages/Home';
import Projects      from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Contact       from './pages/Contact';
import './index.css';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const WA      = import.meta.env.VITE_WHATSAPP || '212600000000';

/* ── TRANSLATIONS ── */
const T = {
  fr: {
    dir:'ltr', lang:'fr',
    nav:{ home:'Accueil', projects:'Réalisations', contact:'Contact', cta:'Devis gratuit' },
    footer:{
      desc:'Menuiseries aluminium haut de gamme — fenêtres, portes, façades & verrières fabriquées sur mesure depuis 2009.',
      nav:'Navigation', services:'Services', contact:'Contact',
      rights:'Tous droits réservés.',
      svc:['Fenêtres & Baies','Portes & Portails','Façades Vitrées','Volets & Stores'],
      addr:'Elkhir 2, Rue Naamia, Boujdour', hours:'Lun–Sam : 8h–18h',
    },
    hero:{
      tag:'Boujdour · Maroc · Depuis 2009',
      t1:'L\'Art de', t2:'l\'Aluminium', t3:'de Précision',
      sub:'Fenêtres, portes, façades & verrières — fabriquées sur mesure avec des matériaux certifiés.',
      btn1:'Nos réalisations', btn2:'Devis WhatsApp',
      trust:'clients satisfaits', trustSub:'partout au Maroc',
      s1:'Ans d\'expérience', s2:'Projets réalisés', s3:'Clients satisfaits',
      cardLbl:'Projets réalisés', cardSub:'depuis 2009',
      card2:'Qualité garantie',
    },
    home:{
      servTag:'Nos expertises', servTitle:'Ce que nous', servTitleEm:'fabriquons',
      servSub:'Solutions aluminium complètes, de la conception à la pose.',
      portTag:'Portfolio', portTitle:'Projets', portTitleEm:'récents', portSub:'',
      viewAll:'Voir tout', noProj:'Aucun projet publié pour le moment.',
      whyTag:'Pourquoi nous', whyTitle:'Qualité &', whyTitleEm:'Savoir-faire',
      whySub:'Depuis 2009, Gil Jakan Aluminium réalise des menuiseries sur mesure avec des matériaux certifiés.',
      whyChecks:['Profilés aluminium certifiés','Double et triple vitrage','Pose professionnelle garantie','Devis gratuit sous 24h','SAV et maintenance inclus','Matériaux importés haut de gamme'],
      contact:'Contactez-nous',
      testiTag:'Avis clients', testiTitle:'Ce que disent nos', testiTitleEm:'clients',
      ctaTitle:'Prêt à démarrer votre projet ?', ctaSub:'Devis gratuit · Visite technique · Réponse sous 24h',
      ctaBtn1:'Formulaire de contact', ctaBtn2:'WhatsApp direct',
    },
    projects:{
      tag:'Portfolio', title:'Nos Réalisations',
      sub:'Découvrez l\'ensemble de nos projets — du résidentiel aux façades commerciales.',
      search:'Rechercher un projet…', all:'Tous', count:'projet', counts:'projets',
      noResult:'Aucun projet trouvé.', prev:'Précédent', next:'Suivant',
    },
    detail:{
      notFound:'Projet introuvable', back:'Retour aux projets',
      about:'À propos du projet', gallery:'Galerie photos', photo:'photo', photos:'photos',
      info:'Informations', cat:'Catégorie', loc:'Localisation', year:'Année', surface:'Surface', client:'Client',
      ctaTitle:'Projet similaire ?', ctaText:'Contactez-nous pour un devis gratuit adapté à votre projet.',
      ctaBtn:'Demander un devis', related:'Projets similaires', allProj:'Tous les projets',
      breadHome:'Accueil', breadProj:'Réalisations',
    },
    contact:{
      tag:'Contact', title:'Parlons de votre', titleEm:'projet',
      sub:'Devis gratuit · Visite technique · Réponse sous 24h',
      infoTitle:'Nos coordonnées', addr:'Adresse', phone:'Téléphone', email:'Email', hours:'Horaires',
      waBtn:'WhatsApp direct', waNote:'Nous répondons généralement dans l\'heure.',
      formTitle:'Envoyez-nous un message',
      name:'Votre nom *', emailF:'Email', phoneF:'Téléphone *', msg:'Votre projet *',
      namePh:'Mohammed Alami', emailPh:'email@exemple.com', phonePh:'+212 6 00 00 00 00',
      msgPh:'Décrivez votre projet…', send:'Envoyer la demande', sending:'Envoi en cours…',
      successTitle:'Message envoyé !', successSub:'Nous vous répondrons dans les plus brefs délais.',
      error:'Une erreur est survenue. Contactez-nous directement sur WhatsApp.',
    },
    services:[
      { title:'Fenêtres & Baies',  desc:'Coulissantes, battantes, oscillo-battantes. Profilés thermiques certifiés.' },
      { title:'Portes & Portails', desc:'Portes d\'entrée et portails motorisés sur mesure, pose garantie.' },
      { title:'Façades Vitrées',   desc:'Murs-rideaux, verrières, claustra aluminium pour bâtiments.' },
      { title:'Devis sur mesure',  desc:'Visite technique gratuite, plans 2D, devis sous 24h sans engagement.' },
      { title:'Volets & Stores',   desc:'Volets roulants et stores banne motorisés ou manuels.' },
      { title:'Garantie Qualité',  desc:'Pose soignée, double vitrage disponible, SAV inclus.' },
    ],
    testi:[
      { name:'Khalid Bennis',     role:'Promoteur Immobilier', stars:5, text:'Travail impeccable, délais respectés. Les menuiseries de nos 40 appartements sont parfaites.' },
      { name:'Alami Construction',role:'Directeur Technique',  stars:5, text:'Partenariat de 3 ans. Qualité constante et équipe réactive. Je recommande fortement.' },
      { name:'Mme Fassi',         role:'Particulière',          stars:5, text:'Résultat bluffant pour ma villa. Excellent rapport qualité-prix et équipe sérieuse.' },
    ],
  },
  ar: {
    dir:'rtl', lang:'ar',
    nav:{ home:'الرئيسية', projects:'إنجازاتنا', contact:'اتصل بنا', cta:'طلب تقدير مجاني' },
    footer:{
      desc:'نوافذ وأبواب وواجهات زجاجية من الألومنيوم عالي الجودة، مُصنَّعة حسب الطلب منذ 2009.',
      nav:'التنقل', services:'خدماتنا', contact:'اتصل بنا',
      rights:'جميع الحقوق محفوظة.',
      svc:['نوافذ وأبواب زجاجية','أبواب وبوابات','واجهات زجاجية','مصاريع وستائر'],
      addr:'حي الخير، بوجدور', hours:'الاثنين–السبت: 8ص–6م',
    },
    hero:{
      tag:'بوجدور · المغرب · منذ 2009',
      t1:'فن صناعة', t2:'الألومنيوم', t3:'بدقة عالية',
      sub:'نوافذ وأبواب وواجهات زجاجية — مُصنَّعة حسب الطلب بمواد معتمدة للعمارة الحديثة.',
      btn1:'إنجازاتنا', btn2:'تقدير عبر واتساب',
      trust:'عميل راضٍ', trustSub:'في جميع أنحاء المغرب',
      s1:'سنة خبرة', s2:'مشروع منجز', s3:'عميل راضٍ',
      cardLbl:'المشاريع المنجزة', cardSub:'منذ 2009',
      card2:'جودة مضمونة',
    },
    home:{
      servTag:'خبراتنا', servTitle:'ما نصنعه', servTitleEm:'',
      servSub:'حلول ألومنيوم متكاملة من التصميم إلى التركيب.',
      portTag:'أعمالنا', portTitle:'مشاريع', portTitleEm:'حديثة', portSub:'',
      viewAll:'عرض الكل', noProj:'لا توجد مشاريع منشورة حاليًا.',
      whyTag:'لماذا نحن', whyTitle:'جودة و', whyTitleEm:'احترافية',
      whySub:'منذ 2009، شركة جيل جاكان تُنجز أعمال الألومنيوم المخصصة بمواد معتمدة وخبرة عالية.',
      whyChecks:['مواد ألومنيوم معتمدة','زجاج مزدوج وثلاثي متوفر','تركيب احترافي مضمون','تقدير مجاني خلال 24 ساعة','صيانة ما بعد البيع مشمولة','مواد مستوردة عالية الجودة'],
      contact:'تواصل معنا',
      testiTag:'آراء العملاء', testiTitle:'ماذا يقول', testiTitleEm:'عملاؤنا',
      ctaTitle:'مستعد لبدء مشروعك؟', ctaSub:'تقدير مجاني · زيارة تقنية · رد خلال 24 ساعة',
      ctaBtn1:'نموذج الاتصال', ctaBtn2:'واتساب مباشر',
    },
    projects:{
      tag:'أعمالنا', title:'إنجازاتنا',
      sub:'اكتشف جميع مشاريعنا — من السكني الراقي إلى الواجهات التجارية.',
      search:'البحث عن مشروع…', all:'الكل', count:'مشروع', counts:'مشروع',
      noResult:'لم يُعثر على أي مشروع.',prev:'السابق',next:'التالي',
    },
    detail:{
      notFound:'المشروع غير موجود', back:'العودة إلى المشاريع',
      about:'حول المشروع', gallery:'معرض الصور', photo:'صورة', photos:'صورة',
      info:'المعلومات', cat:'الفئة', loc:'الموقع', year:'السنة', surface:'المساحة', client:'العميل',
      ctaTitle:'مشروع مماثل؟', ctaText:'تواصل معنا للحصول على تقدير مجاني يناسب مشروعك.',
      ctaBtn:'طلب تقدير', related:'مشاريع مماثلة', allProj:'كل المشاريع',
      breadHome:'الرئيسية', breadProj:'إنجازاتنا',
    },
    contact:{
      tag:'اتصل بنا', title:'لنتحدث عن', titleEm:'مشروعك',
      sub:'تقدير مجاني · زيارة تقنية · رد خلال 24 ساعة',
      infoTitle:'معلومات الاتصال', addr:'العنوان', phone:'الهاتف', email:'البريد', hours:'ساعات العمل',
      waBtn:'واتساب مباشر', waNote:'نرد عادةً في غضون ساعة.',
      formTitle:'أرسل لنا رسالة',
      name:'اسمك *', emailF:'البريد الإلكتروني', phoneF:'رقم الهاتف *', msg:'مشروعك *',
      namePh:'محمد علمي', emailPh:'example@email.com', phonePh:'+212 6 00 00 00 00',
      msgPh:'صِف مشروعك…', send:'إرسال الطلب', sending:'جارٍ الإرسال…',
      successTitle:'تم إرسال رسالتك!', successSub:'سنتواصل معك في أقرب وقت.',
      error:'حدث خطأ. تواصل معنا مباشرةً عبر واتساب.',
    },
    services:[
      { title:'نوافذ وأبواب زجاجية', desc:'انزلاقية وفردية ومزدوجة بمقاطع حرارية عالية الأداء.' },
      { title:'أبواب وبوابات',        desc:'أبواب مدرعة وبوابات كهربائية حسب الطلب.' },
      { title:'واجهات زجاجية',        desc:'ستائر جدارية وقباب زجاجية ومباني ألومنيوم حديثة.' },
      { title:'تقدير حسب الطلب',     desc:'زيارة تقنية مجانية، مخططات 2D، تقدير خلال 24 ساعة.' },
      { title:'مصاريع وستائر',        desc:'مصاريع لفافة وستائر كهربائية أو يدوية.' },
      { title:'ضمان الجودة',          desc:'تركيب احترافي، زجاج مزدوج متاح، صيانة مشمولة.' },
    ],
    testi:[
      { name:'خالد بنيس',    role:'مروّج عقاري',     stars:5, text:'عمل رائع، المواعيد محترمة. نوافذ شققنا الأربعين مثالية.' },
      { name:'علمي للبناء',  role:'مدير تقني',        stars:5, text:'شراكة 3 سنوات. جودة ثابتة وفريق متجاوب. أنصح بهم بشدة.' },
      { name:'السيدة فاسي',  role:'مالكة خاصة',      stars:5, text:'نتيجة مبهرة لفيلتي. جودة ممتازة مقابل ثمن معقول.' },
    ],
  },
};

/* ── CONTEXTS ── */
export const LangCtx  = createContext({ lang:'fr', t:T.fr, setLang:()=>{} });
export const ThemeCtx = createContext({ theme:'light', toggle:()=>{} });
export const useLang  = () => useContext(LangCtx);

/* ── ICONS (inline SVG to avoid react-icons dep) ── */
export const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
export const IconMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
export const IconWA = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.5 5.5 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);
export const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
export const IconX = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
export const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
export const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
export const IconPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
export const IconCal = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
export const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
export const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.77 18.7 19.5 19.5 0 0 1 4.7 12.68 19.79 19.79 0 0 1 1.62 4.07 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.9a16 16 0 0 0 6 6l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
export const IconMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
export const IconMapPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
export const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
export const IconZoom = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);

/* ── REVEAL HOOK ── */
export const useReveal = () => {
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.05 }
    );

    const scan = () => {
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
    };

    // Initial scan
    scan();

    // Re-scan when async data finishes rendering
    window.addEventListener('gjw-rescan', scan);

    // Also watch DOM mutations (route changes, etc.)
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('gjw-rescan', scan);
    };
  }, []);
};

const ScrollTop = () => {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
};

/* ── NAV ── */
const Nav = () => {
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoErr,  setLogoErr]  = useState(false);
  const { theme, toggle }       = useContext(ThemeCtx);
  const { lang, t, setLang }    = useLang();
  const { pathname }            = useLocation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive:true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const links = [
    { to:'/',         label:t.nav.home     },
    { to:'/projects', label:t.nav.projects },
    { to:'/contact',  label:t.nav.contact  },
  ];

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          {!logoErr
            ? <img src="/logo.jpg" alt="Gil Jakan" className="nav-logo-img" onError={() => setLogoErr(true)}/>
            : <div className="nav-logo-fallback">GJ</div>
          }
          <div>
            <div className="nav-logo-name">GIL JAKAN</div>
            <div className="nav-logo-sub">ALUMINIUM</div>
          </div>
        </Link>

        <div className={`nav-links${open ? ' open' : ''}`}>
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`nav-link${pathname===l.to?' active':''}`}>{l.label}</Link>
          ))}
          {/* language toggle */}
          <button className={`lang-btn${lang==='fr'?' active':''}`} onClick={() => setLang('fr')}>FR</button>
          <button className={`lang-btn${lang==='ar'?' active':''}`} onClick={() => setLang('ar')}>ع</button>
          {/* theme toggle */}
          <button className="theme-btn" onClick={toggle} title="Thème">
            {theme === 'dark' ? <IconSun/> : <IconMoon/>}
          </button>
          <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" className="nav-cta">
            <IconWA/> {t.nav.cta}
          </a>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button className="theme-btn" onClick={toggle}
            style={{ display:'none' }} id="theme-mobile">
            {theme === 'dark' ? <IconSun/> : <IconMoon/>}
          </button>
          <button className="nav-menu-btn" onClick={() => setOpen(o => !o)}>
            {open ? <IconX/> : <IconMenu/>}
          </button>
        </div>
      </div>
    </nav>
  );
};

/* ── FOOTER ── */
const Footer = () => {
  const { t, lang } = useLang();
  const [logoErr, setLogoErr] = useState(false);
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div>
            <div className="footer-brand-logo">
              {!logoErr
                ? <img src="/logo.jpg" alt="GJ" className="nav-logo-img" onError={() => setLogoErr(true)}/>
                : <div className="nav-logo-fallback">GJ</div>
              }
              <div>
                <div className="nav-logo-name">GIL JAKAN</div>
                <div className="nav-logo-sub">ALUMINIUM</div>
              </div>
            </div>
            <p className="footer-desc">{t.footer.desc}</p>
          </div>
          <div>
            <div className="footer-col-title">{t.footer.nav}</div>
            <div className="footer-links">
              {[['/', t.nav.home], ['/projects', t.nav.projects], ['/contact', t.nav.contact]].map(([to, label]) => (
                <Link key={to} to={to} className="footer-link">{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <div className="footer-col-title">{t.footer.contact}</div>
            <div className="footer-contact">
              <span className="footer-info">📍 {t.footer.addr}</span>
              <a href="tel:+212600000000" className="footer-link">{WA}</a>
              <a href="mailto:smail.jakani@gmail.com" className="footer-link">✉️ smail.jakani@gmail.com</a>
              <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" className="footer-wa">
                <IconWA/> WhatsApp
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Gil Jakan Aluminium — {t.footer.rights}
        </div>
      </div>
    </footer>
  );
};

/* ── APP ROOT ── */
function AppInner() {
  useReveal();
  const { t } = useLang();
  return (
    <div className="app" dir={t.dir}>
      <ScrollTop/>
      <Nav/>
      <main className="main-content">
        <Routes>
          <Route path="/"             element={<Home/>}/>
          <Route path="/projects"     element={<Projects/>}/>
          <Route path="/projects/:id" element={<ProjectDetail/>}/>
          <Route path="/contact"      element={<Contact/>}/>
        </Routes>
      </main>
      <Footer/>
      <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" className="wa-float">
        <IconWA/>
      </a>
    </div>
  );
}

export default function App() {
  const savedTheme = typeof window!=='undefined' ? localStorage.getItem('gjw-theme') : null;
  const sysDark    = typeof window!=='undefined' && window.matchMedia('(prefers-color-scheme:dark)').matches;
  const [theme, setTheme] = useState(savedTheme || (sysDark ? 'dark' : 'light'));
  const [lang,  setLang]  = useState(localStorage.getItem('gjw-lang') || 'fr');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gjw-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('gjw-lang', lang);
  }, [lang]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const t      = T[lang] || T.fr;

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <LangCtx.Provider value={{ lang, t, setLang }}>
        <BrowserRouter>
          <AppInner/>
        </BrowserRouter>
      </LangCtx.Provider>
    </ThemeCtx.Provider>
  );
}