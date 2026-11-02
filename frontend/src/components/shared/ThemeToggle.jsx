import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LangContext';
import { Sun, Moon, Globe } from 'lucide-react';

/**
 * ThemeToggle — switches between light and dark mode.
 * Used in Navbar and Settings page.
 */
export const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? t('theme.light') : t('theme.dark')}
      title={isDark ? t('theme.light') : t('theme.dark')}
      className={`
        relative flex items-center justify-center
        w-9 h-9 rounded-lg
        text-[var(--text-secondary)] hover:text-[var(--text-primary)]
        hover:bg-[var(--bg-elevated)]
        transition-all duration-200 ease-[var(--ease)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dz-cyan)]
        ${className}
      `}
    >
      {isDark
        ? <Sun  size={18} className="text-[var(--dz-cyan)]" />
        : <Moon size={18} />
      }
    </button>
  );
};

/**
 * LangToggle — switches between Arabic (RTL) and English (LTR).
 */
export const LangToggle = ({ className = '' }) => {
  const { lang, toggleLang } = useLang();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleLang}
      aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
      title={lang === 'ar' ? 'English' : 'عربي'}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg
        text-sm font-medium
        text-[var(--text-secondary)] hover:text-[var(--text-primary)]
        hover:bg-[var(--bg-elevated)]
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dz-cyan)]
        ${className}
      `}
    >
      <Globe size={15} />
      <span>{lang === 'ar' ? 'EN' : 'عر'}</span>
    </button>
  );
};

