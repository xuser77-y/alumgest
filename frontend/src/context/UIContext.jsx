import React, { createContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const { i18n, t } = useTranslation(); // Add 't' here
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [lang, setLang] = useState(i18n.language || 'fr');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const changeLanguage = (newLang) => {
    i18n.changeLanguage(newLang);
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  useEffect(() => {
    // 1. Set Bootstrap Theme
    document.documentElement.setAttribute('data-bs-theme', theme);
    
    // 2. Set Direction (RTL for Arabic, LTR for others)
    // We check the language code directly or use the 'dir' key from our i18n.js
    const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = currentDir;
    document.documentElement.lang = i18n.language;
  }, [theme, i18n.language]);

  return (
    <UIContext.Provider value={{ theme, toggleTheme, lang, changeLanguage }}>
      {children}
    </UIContext.Provider>
  );
};