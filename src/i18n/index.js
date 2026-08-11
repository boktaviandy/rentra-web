import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import idTranslation from './id.json';
import enTranslation from './en.json';

const savedLang = localStorage.getItem('rentra_lang') || 'id';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      id: { translation: idTranslation },
      en: { translation: enTranslation },
    },
    lng: savedLang,
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
