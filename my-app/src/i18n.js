import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      landing: {
        titleLine1: "Welcome to",
        titleLine2: "New York City.",
        subtitle: "Choose your language to get started.",
        continue: "Continue",
      },
      languageNames: {
        english: "English",
        spanish: "Spanish",
        chinese: "Chinese",
        arabic: "Arabic",
        french: "French",
        bengali: "Bengali",
        russian: "Russian",
        other: "Select language",
      },
    },
  },
  es: {
    translation: {
      landing: {
        titleLine1: "Bienvenido a",
        titleLine2: "la ciudad de Nueva York.",
        subtitle: "Elige tu idioma para comenzar.",
        continue: "Continuar",
      },
      languageNames: {
        english: "Ingles",
        spanish: "Espanol",
        chinese: "Chino",
        arabic: "Arabe",
        french: "Frances",
        bengali: "Bengali",
        russian: "Ruso",
        other: "Seleccionar idioma",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "es"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
