import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      dashboard: "Dashboard",
      workers: "Workers",
      all_workers: "All Workers",
      attendance: "Attendance",
      payroll: "Payroll",
      projects: "Projects",
      active_projects: "Active Projects",
      finance: "Finance",
      history: "History",
      analytics: "Analytics",
      settings: "Settings",
      logout: "Logout",
      dir: "ltr"
    }
  },
  fr: {
    translation: {
      dashboard: "Tableau de Bord",
      workers: "Ouvriers",
      all_workers: "Tous les Ouvriers",
      attendance: "Présences",
      payroll: "Paie",
      projects: "Projets",
      active_projects: "Projets Actifs",
      finance: "Finance",
      history: "Historique",
      analytics: "Analytiques",
      settings: "Paramètres",
      logout: "Déconnexion",
      dir: "ltr"
    }
  },
  ar: {
    translation: {
      dashboard: "لوحة القيادة",
      workers: "العمال",
      all_workers: "جميع العمال",
      attendance: "الحضور",
      payroll: "الرواتب",
      projects: "المشاريع",
      active_projects: "المشاريع النشطة",
      finance: "المالية",
      history: "السجل",
      analytics: "التحليلات",
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
      dir: "rtl"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    interpolation: { escapeValue: false }
  });

export default i18n;