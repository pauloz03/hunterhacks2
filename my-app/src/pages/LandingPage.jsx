import { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageCard from "../components/LanguageCard";

const languages = [
  { nativeName: "English", key: "english", code: "en" },
  { nativeName: "Español", key: "spanish", code: "es" },
  { nativeName: "中文", key: "chinese", code: "en" },
  { nativeName: "العربية", key: "arabic", code: "en" },
  { nativeName: "Français", key: "french", code: "en" },
  { nativeName: "বাংলা", key: "bengali", code: "en" },
  { nativeName: "Русский", key: "russian", code: "en" },
  { nativeName: "Other", key: "other", code: "en" },
];

export default function LandingPage() {
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0].nativeName);
  const { t, i18n } = useTranslation();

  return (
    <main className="page">
      <section className="content">
        <header className="hero">
          <div className="brand-row">
            <span aria-hidden className="brand-dot">
              <span className="brand-dot-inner" />
            </span>
            <span className="brand-wordmark">LANDED</span>
          </div>

          <h1 className="title">
            {t("landing.titleLine1")}
            <br />
            {t("landing.titleLine2")}
          </h1>

          <p className="subtitle">{t("landing.subtitle")}</p>
        </header>

        <section className="language-grid" aria-label="Language selection">
          {languages.map((language) => {
            const isActive = selectedLanguage === language.nativeName;
            return (
              <LanguageCard
                key={language.nativeName}
                nativeName={language.nativeName}
                englishName={t(`languageNames.${language.key}`)}
                isActive={isActive}
                onClick={() => {
                  setSelectedLanguage(language.nativeName);
                  i18n.changeLanguage(language.code);
                }}
              />
            );
          })}
        </section>

        <footer className="footer">
          <button type="button" className="continue-button">
            {t("landing.continue")} <span aria-hidden>→</span>
          </button>
        </footer>
      </section>
    </main>
  );
}
