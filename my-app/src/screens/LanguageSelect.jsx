export default function LanguageSelect({ languages, selectedLanguage, onSelectLanguage, onContinue }) {
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
                onClick={() => onSelectLanguage(language.nativeName)}
              >
                <span className="native-name">{language.nativeName}</span>
                <span className="english-name">{language.englishName}</span>
              </button>
            );
          })}
        </section>

        <footer className="footer">
          <button type="button" className="continue-button" onClick={onContinue}>
            Continue <span aria-hidden>→</span>
          </button>
        </footer>
      </section>
    </main>
  );
}
