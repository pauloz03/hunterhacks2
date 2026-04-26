import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { popularLanguageCatalog, searchLanguageCatalog } from "../data/languageCatalog";

export default function LanguageSearchModal({
  isOpen,
  selectedLanguageCode,
  onClose,
  onSelectLanguage,
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isOpen) setQuery("");
  }, [isOpen]);

  const filteredLanguages = useMemo(() => searchLanguageCatalog(query), [query]);

  if (!isOpen) return null;

  return (
    <div className="language-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="language-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("landing.languageModal.chooseLanguageAria", { defaultValue: "Choose language" })}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="language-modal-header">
          <h2 className="language-modal-title">
            {t("landing.languageModal.chooseYourLanguage", { defaultValue: "Choose your language" })}
          </h2>
          <button
            type="button"
            className="language-modal-close"
            onClick={onClose}
            aria-label={t("landing.languageModal.closeAria", { defaultValue: "Close language selector" })}
          >
            ✕
          </button>
        </header>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="language-modal-search"
          placeholder={t("landing.languageModal.searchPlaceholder", {
            defaultValue: "Search language (e.g. Arabic, বাংলা, es)",
          })}
          aria-label={t("landing.languageModal.searchAria", { defaultValue: "Search language" })}
        />

        <section className="language-modal-section">
          <h3 className="language-modal-section-title">{t("landing.languageModal.popular", { defaultValue: "Popular" })}</h3>
          <div
            className="language-modal-list"
            aria-label={t("landing.languageModal.popularAria", { defaultValue: "Popular languages" })}
          >
            {popularLanguageCatalog.map((language) => {
              const isActive = selectedLanguageCode === language.code;
              return (
                <button
                  key={`popular-${language.code}`}
                  type="button"
                  className={`language-modal-option ${isActive ? "active" : ""}`}
                  onClick={() => onSelectLanguage(language.code)}
                >
                  <span>{language.nativeName}</span>
                  <small>{language.englishName}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="language-modal-section">
          <h3 className="language-modal-section-title">
            {t("landing.languageModal.allLanguages", { defaultValue: "All languages" })}
          </h3>
          <div
            className="language-modal-list language-modal-list--scroll"
            aria-label={t("landing.languageModal.allLanguagesAria", { defaultValue: "All languages" })}
          >
            {filteredLanguages.map((language) => {
              const isActive = selectedLanguageCode === language.code;
              return (
                <button
                  key={language.code}
                  type="button"
                  className={`language-modal-option ${isActive ? "active" : ""}`}
                  onClick={() => onSelectLanguage(language.code)}
                >
                  <span>{language.nativeName}</span>
                  <small>
                    {language.englishName} ({language.code})
                  </small>
                </button>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
