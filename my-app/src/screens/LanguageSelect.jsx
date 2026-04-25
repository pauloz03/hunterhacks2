export default function LanguageSelect({
  languages,
  selectedLanguage,
  titleLine1,
  titleLine2,
  subtitle,
  continueLabel,
  onSelectLanguage,
  onContinue,
}) {
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
            {titleLine1}
            <br />
            {titleLine2}
          </h1>

          <p className="subtitle">{subtitle}</p>
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
            {continueLabel} <span aria-hidden>→</span>
          </button>
        </footer>
      </section>
    </main>
  );
}
