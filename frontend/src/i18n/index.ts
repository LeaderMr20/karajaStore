import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar';
import en from './en';

const savedLang = localStorage.getItem('lang') || 'ar';

document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLang;

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
});

export const switchLanguage = (lang: 'ar' | 'en') => {
  i18n.changeLanguage(lang);
  localStorage.setItem('lang', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

export default i18n;
