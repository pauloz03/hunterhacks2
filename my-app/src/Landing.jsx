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
