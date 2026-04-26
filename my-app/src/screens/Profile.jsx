import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import VisitorFooterNav from "../components/VisitorFooterNav";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout, updateUser } = useAuth();
  const persona = user?.persona_type ?? "neighbor";
  const [loggingOut, setLoggingOut] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(user?.display_name ?? "");
  const [nameError, setNameError] = useState("");
  const [isEditingLanguage, setIsEditingLanguage] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState("");
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(
    user?.language_code || i18n.language || "en",
  );

  const languageOptions = [
    { code: "en", key: "english" },
    { code: "es", key: "spanish" },
    { code: "zh", key: "chinese" },
    { code: "ar", key: "arabic" },
    { code: "fr", key: "french" },
    { code: "bn", key: "bengali" },
    { code: "ru", key: "russian" },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id }),
      });
    } catch {
      // proceed with local logout even if backend is unreachable
    }
    logout();
  }

  const profile = {
    role: t(`profile.persona.${persona}.role`, { defaultValue: t("profile.persona.neighbor.role") }),
    note: t(`profile.persona.${persona}.note`, { defaultValue: t("profile.persona.neighbor.note") }),
  };
  const displayName = (user?.display_name || "").trim() || t("profile.userLabel");

  async function handleSaveName(event) {
    event.preventDefault();
    setNameError("");
    setSavingName(true);
    const nextName = displayNameInput.trim();
    try {
      const res = await fetch(`${BACKEND_URL}/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          display_name: nextName || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update name.");

      updateUser({ display_name: nextName || null });
      setDisplayNameInput(nextName);
      setIsEditingName(false);
    } catch (error) {
      setNameError(error?.message || "Failed to update name.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveLanguage(event) {
    event.preventDefault();
    setLanguageError("");
    setSavingLanguage(true);

    try {
      const res = await fetch(`${BACKEND_URL}/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          language_code: selectedLanguageCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update language.");

      updateUser({ language_code: selectedLanguageCode });
      await i18n.changeLanguage(selectedLanguageCode);
      setIsEditingLanguage(false);
    } catch (error) {
      setLanguageError(error?.message || "Failed to update language.");
    } finally {
      setSavingLanguage(false);
    }
  }

  return (
    <main className={`visitor-page visitor-page--${persona}`}>
      <section className="profile-content">
        <h1 className="profile-title">{t("profile.title")}</h1>

        <article className="profile-card">
          <div className="profile-avatar" aria-hidden>
            👤
          </div>
          <div className="profile-details">
            <p className="profile-name">{displayName}</p>
            <span className="profile-role-pill">{profile.role}</span>
            <p className="profile-note">{profile.note}</p>
          </div>
        </article>

        <section className="profile-list" aria-label={t("profile.actionsAria")}>
          <button
            type="button"
            className="profile-list-item"
            onClick={() => {
              setDisplayNameInput((user?.display_name ?? "").trim());
              setIsEditingName(true);
            }}
          >
            <span>{t("profile.editAccount")}</span>
            <span className="profile-list-item-arrow" aria-hidden>
              ▼
            </span>
          </button>
          {isEditingName ? (
            <form className="profile-name-form" onSubmit={handleSaveName}>
              <label className="profile-name-label" htmlFor="profile-display-name-input">
                Name
              </label>
              <input
                id="profile-display-name-input"
                className="profile-name-input"
                type="text"
                value={displayNameInput}
                onChange={(event) => setDisplayNameInput(event.target.value)}
                placeholder="Enter your name"
                maxLength={60}
              />
              <div className="profile-name-actions">
                <button type="submit" className="profile-name-save-button" disabled={savingName}>
                  {savingName ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="profile-name-cancel-button"
                  disabled={savingName}
                  onClick={() => {
                    setDisplayNameInput((user?.display_name ?? "").trim());
                    setNameError("");
                    setIsEditingName(false);
                  }}
                >
                  Cancel
                </button>
              </div>
              {nameError ? <p className="profile-name-error">{nameError}</p> : null}
            </form>
          ) : null}
          <button
            type="button"
            className="profile-list-item"
            onClick={() => {
              setSelectedLanguageCode(user?.language_code || i18n.language || "en");
              setLanguageError("");
              setIsEditingLanguage(true);
            }}
          >
            <span>{t("profile.languagePreferences")}</span>
            <span className="profile-list-item-arrow" aria-hidden>
              ▼
            </span>
          </button>
          {isEditingLanguage ? (
            <form className="profile-language-form" onSubmit={handleSaveLanguage}>
              <label className="profile-language-label" htmlFor="profile-language-select">
                {t("profile.languagePreferences")}
              </label>
              <select
                id="profile-language-select"
                className="profile-language-select"
                value={selectedLanguageCode}
                onChange={(event) => setSelectedLanguageCode(event.target.value)}
              >
                {languageOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {t(`languageNames.${option.key}`)}
                  </option>
                ))}
              </select>
              <div className="profile-language-actions">
                <button type="submit" className="profile-language-save-button" disabled={savingLanguage}>
                  {savingLanguage ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="profile-language-cancel-button"
                  disabled={savingLanguage}
                  onClick={() => {
                    setSelectedLanguageCode(user?.language_code || i18n.language || "en");
                    setLanguageError("");
                    setIsEditingLanguage(false);
                  }}
                >
                  Cancel
                </button>
              </div>
              {languageError ? <p className="profile-language-error">{languageError}</p> : null}
            </form>
          ) : null}
          <button
            type="button"
            className="profile-list-item profile-list-item--logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <span>{loggingOut ? t("profile.signingOut") : t("profile.signOut")}</span>
            <span className="profile-list-item-arrow" aria-hidden>
              ▼
            </span>
          </button>
        </section>
      </section>

      <VisitorFooterNav />
    </main>
  );
}
