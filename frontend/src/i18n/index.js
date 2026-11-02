import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ── Translation files imported directly (no HTTP loader needed for Vite) ──────
import arCommon     from './locales/ar/common.json';
import arAuth       from './locales/ar/auth.json';
import arCompany    from './locales/ar/company.json';
import arCatalog    from './locales/ar/catalog.json';
import arRfq        from './locales/ar/rfq.json';
import arOffer      from './locales/ar/offer.json';
import arDeal       from './locales/ar/deal.json';
import arAdmin      from './locales/ar/admin.json';

import enCommon     from './locales/en/common.json';
import enAuth       from './locales/en/auth.json';
import enCompany    from './locales/en/company.json';
import enCatalog    from './locales/en/catalog.json';
import enRfq        from './locales/en/rfq.json';
import enOffer      from './locales/en/offer.json';
import enDeal       from './locales/en/deal.json';
import enAdmin      from './locales/en/admin.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        common:  arCommon,
        auth:    arAuth,
        company: arCompany,
        catalog: arCatalog,
        rfq:     arRfq,
        offer:   arOffer,
        deal:    arDeal,
        admin:   arAdmin,
      },
      en: {
        common:  enCommon,
        auth:    enAuth,
        company: enCompany,
        catalog: enCatalog,
        rfq:     enRfq,
        offer:   enOffer,
        deal:    enDeal,
        admin:   enAdmin,
      },
    },
    // default & fallback
    lng: 'ar',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'company', 'catalog', 'rfq', 'offer', 'deal', 'admin'],

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'dz_lang',
    },

    interpolation: {
      escapeValue: false, // React handles XSS
    },
  });

// ── RTL helper: apply dir + lang attributes on language change ────────────────
const applyHtmlDir = (lang) => {
  const isRtl = lang === 'ar';
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
};

applyHtmlDir(i18n.language);
i18n.on('languageChanged', applyHtmlDir);

export default i18n;

