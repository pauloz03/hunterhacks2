import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function ProfileScreen({ onNavigate }) {
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

  const profileByPersona = {
    visitor:   { role: "Visitor",          note: "Short stay profile with quick trip preferences." },
    neighbor:  { role: "New Neighbor",     note: "Local setup for your new neighborhood essentials." },
    immigrant: { role: "Immigrant",        note: "Resources tailored to settling into NYC life." },
    refugee:   { role: "Refugee",          note: "Support-focused profile with trusted resources." },
    student:   { role: "Student",          note: "Campus and city resources for student life." },
    familiar:  { role: "Already Familiar", note: "Keep your saved places and routine updates here." },
  };

  const profile = profileByPersona[persona] || profileByPersona.neighbor;

  return (
    <main className={`visitor-page visitor-page--${persona}`}>
      <section className="profile-content">
        <h1 className="profile-title">Profile</h1>
        <p className="profile-subtitle">Temporary page while profile features are being built.</p>

        <article className="profile-card">
          <div className="profile-avatar" aria-hidden>
            👤
          </div>
          <div className="profile-details">
            <p className="profile-name">Landed User</p>
            <span className="profile-role-pill">{profile.role}</span>
            <p className="profile-note">{profile.note}</p>
          </div>
        </article>

        <section className="profile-list" aria-label="Profile actions">
          <button type="button" className="profile-list-item">
            Edit account details
          </button>
          <button type="button" className="profile-list-item">
            Language preferences
          </button>
          <button type="button" className="profile-list-item">
            Notification settings
          </button>
          <button
            type="button"
            className="profile-list-item profile-list-item--logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </section>
      </section>

      <nav className="visitor-bottom-nav" aria-label="Primary">
        <div className="visitor-nav-item">
          <button type="button" className="visitor-nav-icon-button" aria-label="Home" onClick={() => onNavigate("home")}>
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.5 9.8V20h13V9.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="visitor-nav-label">Home</span>
        </div>
        <div className="visitor-nav-item">
          <button type="button" className="visitor-nav-icon-button" aria-label="Map" onClick={() => onNavigate("map")}>
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <span className="visitor-nav-label">Map</span>
        </div>
        <div className="visitor-nav-item">
          <button type="button" className="visitor-nav-icon-button" aria-label="Ask" onClick={() => onNavigate("ask")}>
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-5 4v-13.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="visitor-nav-label">Ask</span>
        </div>
        <div className="visitor-nav-item">
          <button type="button" className="visitor-nav-icon-button" aria-label="Saved" onClick={() => onNavigate("saved")}>
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="visitor-nav-label">Saved</span>
        </div>
        <div className="visitor-nav-item active">
          <button type="button" className="visitor-nav-icon-button" aria-label="Profile">
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" />
              <path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <span className="visitor-nav-label">Profile</span>
        </div>
      </nav>
    </main>
  );
}
