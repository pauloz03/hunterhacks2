import { useState } from "react";

const languages = [
  { nativeName: "English", englishName: "English" },
  { nativeName: "Español", englishName: "Spanish" },
  { nativeName: "中文", englishName: "Chinese" },
  { nativeName: "العربية", englishName: "Arabic" },
  { nativeName: "Français", englishName: "French" },
  { nativeName: "বাংলা", englishName: "Bengali" },
  { nativeName: "Русский", englishName: "Russian" },
  { nativeName: "Other", englishName: "Select language" },
];

export default function Landing() {
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0].nativeName);
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);

  if (!showLanguageSelect) {
    return (
      <main className="page intro-page">
        <section className="intro-content">

          <article className="floating-card card-transit">
            <span className="floating-icon" aria-hidden>
              🚇
            </span>
            <span className="floating-label">Transit</span>
          </article>

          <article className="floating-card card-health">
            <span className="floating-icon" aria-hidden>
              🏥
            </span>
            <span className="floating-label">Health</span>
          </article>

          <article className="floating-card card-legal">
            <span className="floating-icon" aria-hidden>
              ⚖️
            </span>
            <span className="floating-label">Legal</span>
          </article>

          <article className="floating-card card-food">
            <span className="floating-icon" aria-hidden>
              🍽️
            </span>
            <span className="floating-label">Food</span>
          </article>

          <article className="floating-card card-housing">
            <span className="floating-icon" aria-hidden>
              🏠
            </span>
            <span className="floating-label">Housing</span>
          </article>

          <article className="floating-card card-education">
            <span className="floating-icon" aria-hidden>
              📚
            </span>
            <span className="floating-label">Education</span>
          </article>

          <section className="intro-center">
            <span aria-hidden className="intro-logo-mark">
              <span className="intro-logo-dot" />
            </span>
            <h1 className="intro-title">LANDED</h1>
            <p className="intro-subtitle">Your guide to</p>
            <p className="intro-subtitle intro-subtitle-strong">
              <span>New York City,</span> in your language.
            </p>

            <div className="intro-language-pills" aria-label="Supported languages">
              {languages.slice(0, 6).map((language) => (
                <span key={language.nativeName} className="pill">
                  {language.nativeName}
                </span>
              ))}
            </div>

            <button type="button" className="get-started-button" onClick={() => setShowLanguageSelect(true)}>
              Get started <span aria-hidden>→</span>
            </button>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="page language-page">
      <section className="content language-content">
        <header className="hero language-hero">
          <div className="brand-row">
            <span aria-hidden className="brand-dot">
              <span className="brand-dot-inner" />
            </span>
            <span className="brand-wordmark">LANDED</span>
          </div>

          <h1 className="title">
            Welcome to
            <br />
            New York City.
          </h1>

          <p className="subtitle">Choose your language to get started.</p>
        </header>

        <section className="language-grid" aria-label="Language selection">
          {languages.map((language) => {
            const isActive = selectedLanguage === language.nativeName;
            return (
              <button
                key={language.nativeName}
                type="button"
                className={`language-card ${isActive ? "active" : ""}`}
                aria-pressed={isActive}
                onClick={() => setSelectedLanguage(language.nativeName)}
              >
                <span className="native-name">{language.nativeName}</span>
                <span className="english-name">{language.englishName}</span>
              </button>
            );
          })}
        </section>

        <footer className="footer">
          <button type="button" className="continue-button">
            Continue <span aria-hidden>→</span>
          </button>
        </footer>
      </section>
    </main>
  );
}
