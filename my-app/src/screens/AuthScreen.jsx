import { useTranslation } from "react-i18next";

export default function AuthScreen({
  selectedLanguage,
  authMode,
  onSetAuthMode,
  onBack,
  onSubmit,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  isSubmitting,
  message,
}) {
  const { t } = useTranslation();

  return (
    <main className="page auth-page">
      <section className="content auth-content">
        <button type="button" className="auth-back-button" onClick={onBack}>
          ← {t("auth.backToLanguage")}
        </button>

        <header className="auth-header">
          <span className="auth-eyebrow">{t("auth.languageSelected")} {selectedLanguage}</span>
          <h1 className="auth-title">{authMode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}</h1>
          <p className="auth-subtitle">
            {authMode === "login"
              ? t("auth.loginSubtitle")
              : t("auth.signupSubtitle")}
          </p>
        </header>

        <div className="auth-mode-toggle" role="tablist" aria-label={t("auth.modeAriaLabel")}>
          <button
            type="button"
            className={`auth-toggle-button ${authMode === "login" ? "active" : ""}`}
            onClick={() => onSetAuthMode("login")}
            aria-pressed={authMode === "login"}
          >
            {t("auth.logIn")}
          </button>
          <button
            type="button"
            className={`auth-toggle-button ${authMode === "signup" ? "active" : ""}`}
            onClick={() => onSetAuthMode("signup")}
            aria-pressed={authMode === "signup"}
          >
            {t("auth.signUp")}
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="auth-label" htmlFor="email-input">
            {t("auth.email")}
          </label>
          <input
            className="auth-input"
            id="email-input"
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            required
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            autoComplete="email"
          />

          <label className="auth-label" htmlFor="password-input">
            {t("auth.password")}
          </label>
          <input
            className="auth-input"
            id="password-input"
            type="password"
            placeholder={t("auth.passwordPlaceholder")}
            required
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
          />

          <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
            {authMode === "login" ? t("auth.logIn") : t("auth.createAccountCta")}
          </button>
          {message ? <p className="auth-message">{message}</p> : null}
        </form>
      </section>
    </main>
  );
}
