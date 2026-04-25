export default function AuthScreen({
  selectedLanguage,
  authMode,
  onSetAuthMode,
  onBack,
  onSubmit,
}) {
  return (
    <main className="page auth-page">
      <section className="content auth-content">
        <button type="button" className="auth-back-button" onClick={onBack}>
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
            onClick={() => onSetAuthMode("login")}
            aria-pressed={authMode === "login"}
          >
            Log in
          </button>
          <button
            type="button"
            className={`auth-toggle-button ${authMode === "signup" ? "active" : ""}`}
            onClick={() => onSetAuthMode("signup")}
            aria-pressed={authMode === "signup"}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
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
