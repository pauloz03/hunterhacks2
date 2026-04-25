const savedItemsByUserType = {
  visitor: [
    { icon: "⚖️", title: "Downtown Legal Aid", subtitle: "0.9 mi away", type: "Legal" },
    { icon: "🏥", title: "24/7 Urgent Care", subtitle: "1.3 mi away", type: "Health" },
  ],
  neighbor: [
    { icon: "🏥", title: "Community Health Clinic", subtitle: "0.7 mi away", type: "Health" },
    { icon: "📚", title: "Queens Public Library", subtitle: "1.1 mi away", type: "Education" },
  ],
  familiar: [
    { icon: "🍽️", title: "Neighborhood Food Pantry", subtitle: "0.6 mi away", type: "Food" },
    { icon: "🚌", title: "Transit Help Desk", subtitle: "1.8 mi away", type: "Transit" },
  ],
  refugee: [
    { icon: "🏠", title: "Housing Intake Center", subtitle: "0.8 mi away", type: "Housing" },
    { icon: "⚖️", title: "Refugee Legal Services", subtitle: "1.2 mi away", type: "Legal" },
  ],
};

import { useAuth } from "../context/AuthContext";

export default function SavedScreen({ onNavigate }) {
  const { user } = useAuth();
  const persona = user?.persona_type ?? "neighbor";
  const savedItems = savedItemsByUserType[persona] || savedItemsByUserType.neighbor;

  return (
    <main className={`visitor-page visitor-page--${persona}`}>
      <section className="saved-content">
        <h1 className="saved-title">Saved resources</h1>
        <p className="saved-subtitle">Temporary page for map bookmarks while backend save is being built.</p>

        <section className="saved-list" aria-label="Bookmarked resources">
          {savedItems.map((item) => (
            <article key={item.title} className="saved-item-card">
              <span className="saved-item-icon" aria-hidden>
                {item.icon}
              </span>
              <div className="saved-item-copy">
                <p className="saved-item-title">{item.title}</p>
                <p className="saved-item-subtitle">{item.subtitle}</p>
                <span className="saved-item-type">{item.type}</span>
              </div>
              <span className="saved-item-bookmark" aria-hidden>
                ♥
              </span>
            </article>
          ))}
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
        <div className="visitor-nav-item active">
          <button type="button" className="visitor-nav-icon-button" aria-label="Saved">
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="visitor-nav-label">Saved</span>
        </div>
        <div className="visitor-nav-item">
          <button type="button" className="visitor-nav-icon-button" aria-label="Profile" onClick={() => onNavigate("profile")}>
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
