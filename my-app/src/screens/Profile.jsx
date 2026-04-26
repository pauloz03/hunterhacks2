import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import VisitorFooterNav from "../components/VisitorFooterNav";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const persona = user?.persona_type ?? "neighbor";
  const [loggingOut, setLoggingOut] = useState(false);

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

  return (
    <main className={`visitor-page visitor-page--${persona}`}>
      <section className="profile-content">
        <h1 className="profile-title">{t("profile.title")}</h1>
        <p className="profile-subtitle">{t("profile.subtitle")}</p>

        <article className="profile-card">
          <div className="profile-avatar" aria-hidden>
            👤
          </div>
          <div className="profile-details">
            <p className="profile-name">{t("profile.userLabel")}</p>
            <span className="profile-role-pill">{profile.role}</span>
            <p className="profile-note">{profile.note}</p>
          </div>
        </article>

        <section className="profile-list" aria-label={t("profile.actionsAria")}>
          <button type="button" className="profile-list-item">
            {t("profile.editAccount")}
          </button>
          <button type="button" className="profile-list-item">
            {t("profile.languagePreferences")}
          </button>
          <button type="button" className="profile-list-item">
            {t("profile.notificationSettings")}
          </button>
          <button
            type="button"
            className="profile-list-item profile-list-item--logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? t("profile.signingOut") : t("profile.signOut")}
          </button>
        </section>
      </section>

      <VisitorFooterNav />
    </main>
  );
}
