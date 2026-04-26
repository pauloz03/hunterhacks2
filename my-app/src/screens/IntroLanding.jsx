import landedBackgroundVideo from "../../assets/images/Landedbg.mp4";

export default function IntroLanding({ languages, copy, onGetStarted }) {
  return (
    <main className="page intro-page">
      <section className="intro-content">
        <video
          className="intro-bg-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src={landedBackgroundVideo} type="video/mp4" />
        </video>
        <div className="intro-bg-overlay" aria-hidden="true" />

        <article className="floating-card card-transit">
          <span className="floating-icon" aria-hidden>
            🚇
          </span>
          <span className="floating-label">{copy.floatingTransit}</span>
        </article>

        <article className="floating-card card-health">
          <span className="floating-icon" aria-hidden>
            🏥
          </span>
          <span className="floating-label">{copy.floatingHealth}</span>
        </article>

        <article className="floating-card card-legal">
          <span className="floating-icon" aria-hidden>
            ⚖️
          </span>
          <span className="floating-label">{copy.floatingLegal}</span>
        </article>

        <article className="floating-card card-food">
          <span className="floating-icon" aria-hidden>
            🍽️
          </span>
          <span className="floating-label">{copy.floatingFood}</span>
        </article>

        <article className="floating-card card-housing">
          <span className="floating-icon" aria-hidden>
            🏠
          </span>
          <span className="floating-label">{copy.floatingHousing}</span>
        </article>

        <article className="floating-card card-education">
          <span className="floating-icon" aria-hidden>
            📚
          </span>
          <span className="floating-label">{copy.floatingEducation}</span>
        </article>

        <section className="intro-center">
          <span aria-hidden className="intro-logo-mark">
            <span className="intro-logo-dot" />
          </span>
          <h1 className="intro-title">{copy.brandTitle}</h1>
          <p className="intro-subtitle">{copy.guidePrefix}</p>
          <p className="intro-subtitle intro-subtitle-strong">
            <span>{copy.cityPhrase}</span> {copy.languagePhrase}
          </p>

          <div className="intro-language-pills" aria-label={copy.supportedLanguagesAria}>
            {languages.slice(0, 6).map((language) => (
              <span key={language.nativeName} className="pill">
                {language.nativeName}
              </span>
            ))}
          </div>

          <button type="button" className="get-started-button" onClick={onGetStarted}>
            {copy.getStarted} <span aria-hidden>→</span>
          </button>
        </section>
      </section>
    </main>
  );
}
