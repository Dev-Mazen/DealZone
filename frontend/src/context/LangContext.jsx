import { createContext, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const LangContext = createContext(null);

export const LangProvider = ({ children }) => {
  const { i18n } = useTranslation();

  const lang    = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const isRtl   = lang === 'ar';
  const dir     = isRtl ? 'rtl' : 'ltr';

  const switchLang = useCallback(
    (target) => {
      const next = target ?? (lang === 'ar' ? 'en' : 'ar');
      i18n.changeLanguage(next);
    },
    [i18n, lang]
  );

  const toggleLang = useCallback(() => switchLang(), [switchLang]);

  return (
    <LangContext.Provider value={{ lang, isRtl, dir, switchLang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
};

export default LangContext;

