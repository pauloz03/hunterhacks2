import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      intro: {
        brandTitle: "LANDED",
        guidePrefix: "Your guide to",
        cityPhrase: "New York City,",
        languagePhrase: "in your language.",
        getStarted: "Get started",
      },
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
      intro: {
        brandTitle: "LANDED",
        guidePrefix: "Tu guia para",
        cityPhrase: "la ciudad de Nueva York,",
        languagePhrase: "en tu idioma.",
        getStarted: "Comenzar",
      },
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
  zh: {
    translation: {
      intro: {
        brandTitle: "LANDED",
        guidePrefix: "你的纽约指南",
        cityPhrase: "纽约市，",
        languagePhrase: "用你的语言。",
        getStarted: "开始",
      },
      landing: {
        titleLine1: "欢迎来到",
        titleLine2: "纽约市。",
        subtitle: "选择你的语言开始。",
        continue: "继续",
      },
      languageNames: {
        english: "英语",
        spanish: "西班牙语",
        chinese: "中文",
        arabic: "阿拉伯语",
        french: "法语",
        bengali: "孟加拉语",
        russian: "俄语",
        other: "选择语言",
      },
    },
  },
  ar: {
    translation: {
      intro: {
        brandTitle: "LANDED",
        guidePrefix: "دليلك إلى",
        cityPhrase: "مدينة نيويورك،",
        languagePhrase: "بلغتك.",
        getStarted: "ابدأ",
      },
      landing: {
        titleLine1: "مرحبًا بك في",
        titleLine2: "مدينة نيويورك.",
        subtitle: "اختر لغتك للبدء.",
        continue: "متابعة",
      },
      languageNames: {
        english: "الإنجليزية",
        spanish: "الإسبانية",
        chinese: "الصينية",
        arabic: "العربية",
        french: "الفرنسية",
        bengali: "البنغالية",
        russian: "الروسية",
        other: "اختر اللغة",
      },
    },
  },
  fr: {
    translation: {
      intro: {
        brandTitle: "LANDED",
        guidePrefix: "Votre guide pour",
        cityPhrase: "la ville de New York,",
        languagePhrase: "dans votre langue.",
        getStarted: "Commencer",
      },
      landing: {
        titleLine1: "Bienvenue a",
        titleLine2: "la ville de New York.",
        subtitle: "Choisissez votre langue pour commencer.",
        continue: "Continuer",
      },
      languageNames: {
        english: "Anglais",
        spanish: "Espagnol",
        chinese: "Chinois",
        arabic: "Arabe",
        french: "Francais",
        bengali: "Bengali",
        russian: "Russe",
        other: "Choisir la langue",
      },
    },
  },
  bn: {
    translation: {
      intro: {
        brandTitle: "LANDED",
        guidePrefix: "আপনার গাইড",
        cityPhrase: "নিউ ইয়র্ক সিটি,",
        languagePhrase: "আপনার ভাষায়।",
        getStarted: "শুরু করুন",
      },
      landing: {
        titleLine1: "স্বাগতম",
        titleLine2: "নিউ ইয়র্ক সিটিতে।",
        subtitle: "শুরু করতে আপনার ভাষা বেছে নিন।",
        continue: "চালিয়ে যান",
      },
      languageNames: {
        english: "ইংরেজি",
        spanish: "স্প্যানিশ",
        chinese: "চীনা",
        arabic: "আরবি",
        french: "ফরাসি",
        bengali: "বাংলা",
        russian: "রুশ",
        other: "ভাষা নির্বাচন করুন",
      },
    },
  },
  ru: {
    translation: {
      intro: {
        brandTitle: "LANDED",
        guidePrefix: "Ваш гид по",
        cityPhrase: "Нью-Йорку,",
        languagePhrase: "на вашем языке.",
        getStarted: "Начать",
      },
      landing: {
        titleLine1: "Добро пожаловать в",
        titleLine2: "Нью-Йорк.",
        subtitle: "Выберите язык, чтобы начать.",
        continue: "Продолжить",
      },
      languageNames: {
        english: "Английский",
        spanish: "Испанский",
        chinese: "Китайский",
        arabic: "Арабский",
        french: "Французский",
        bengali: "Бенгальский",
        russian: "Русский",
        other: "Выбрать язык",
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
    supportedLngs: ["en", "es", "zh", "ar", "fr", "bn", "ru"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
