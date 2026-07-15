import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "./locales/en/translation.json";
import arTranslation from "./locales/ar/translation.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    ar: { translation: arTranslation },
  },
  lng: localStorage.getItem("lang") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;

// import i18n from 'i18next';
// import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';
// import enTranslation from './locales/en/translation.json';
// import arTranslation from './locales/ar/translation.json';

// i18n
//   .use(LanguageDetector)
//   .use(initReactI18next)
//   .init({
//     resources: {
//       en: { translation: enTranslation },
//       ar: { translation: arTranslation },
//     },
//     fallbackLng: 'en',
//     detection: {
//       order: ['localStorage', 'navigator'],
//       caches: ['localStorage'],
//     },
//     interpolation: {
//       escapeValue: false,
//     },
//   });

// export default i18n;
