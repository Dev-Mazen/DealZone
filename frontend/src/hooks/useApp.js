import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LangContext';

/**
 * Reusable hook that bundles translation + theme + lang in one call.
 * Usage: const { t, isDark, isRtl, toggleTheme, toggleLang } = useApp();
 */
const useApp = (ns = 'common') => {
  const { t, i18n } = useTranslation(ns);
  const { isDark, toggleTheme } = useTheme();
  const { isRtl, dir, lang, toggleLang, switchLang } = useLang();

  return {
    t,
    i18n,
    isDark,
    toggleTheme,
    isRtl,
    dir,
    lang,
    toggleLang,
    switchLang,
  };
};

export default useApp;

