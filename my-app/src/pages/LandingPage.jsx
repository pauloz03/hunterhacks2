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
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const { t, i18n } = useTranslation();

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

            <button
              type="button"
              className="get-started-button"
              onClick={() => setShowLanguageSelect(true)}
            >
              Get started <span aria-hidden>→</span>
            </button>
          </section>
        </section>
      </main>
    );
  }

  if (showAuth) {
    return (
      <main className="page auth-page">
        <section className="content auth-content">
          <button type="button" className="auth-back-button" onClick={() => setShowAuth(false)}>
            ← Back to language selection
          </button>

          <header className="auth-header">
            <span className="auth-eyebrow">Language selected: {selectedLanguage}</span>
            <h1 className="auth-title">{authMode === "login" ? "Welcome back" : "Create your account"}</h1>
            <p className="auth-subtitle">
              {authMode === "login"
                ? "Log in to continue with personalized guidance."
                : "Sign up to save your progress and language preferences."}
            </p>
          </header>

          <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={`auth-toggle-button ${authMode === "login" ? "active" : ""}`}
              onClick={() => setAuthMode("login")}
              aria-pressed={authMode === "login"}
            >
              Log in
            </button>
            <button
              type="button"
              className={`auth-toggle-button ${authMode === "signup" ? "active" : ""}`}
              onClick={() => setAuthMode("signup")}
              aria-pressed={authMode === "signup"}
            >
              Sign up
            </button>
          </div>

          <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
            <label className="auth-label" htmlFor="email-input">
              Email
            </label>
            <input className="auth-input" id="email-input" type="email" placeholder="you@example.com" required />

            <label className="auth-label" htmlFor="password-input">
              Password
            </label>
            <input className="auth-input" id="password-input" type="password" placeholder="••••••••" required />

            <button type="submit" className="auth-submit-button">
              {authMode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
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
          <button type="button" className="continue-button" onClick={() => setShowAuth(true)}>
            {t("landing.continue")} <span aria-hidden>→</span>
          </button>
        </footer>
      </section>
    </main>
  );
}
