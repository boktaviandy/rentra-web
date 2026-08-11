import { useTranslation } from 'react-i18next';

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLang = i18n.language || 'id';

  const setLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('rentra_lang', lang);
  };

  const toggleLanguage = () => {
    const nextLang = currentLang === 'id' ? 'en' : 'id';
    setLanguage(nextLang);
  };

  return { currentLang, setLanguage, toggleLanguage };
}
