const homeContentByUserType = {
  visitor: {
    rolePill: "Visitor",
    titleLine1: "Welcome to your",
    titleLine2: "visit.",
    aiMessage: "Top transit tips and must-see events are ready for this week.",
    forYouItems: [
      { icon: "🗺️", title: "Best subway route", subtitle: "Fastest path to Midtown", tag: "Transit", tagClass: "community" },
      { icon: "🎟️", title: "Free museum day", subtitle: "Open today · No ticket fee", tag: "Culture", tagClass: "education" },
      { icon: "🍽️", title: "Budget-friendly eats", subtitle: "Great options nearby", tag: "Food", tagClass: "health" },
    ],
  },
  neighbor: {
    rolePill: "New Neighbor",
    titleLine1: "Welcome to your new",
    titleLine2: "neighborhood.",
    aiMessage: "Your local community board meeting is tomorrow at 7pm.",
    forYouItems: [
      { icon: "🏥", title: "Local health clinic", subtitle: "Sliding scale fees", tag: "Health", tagClass: "health" },
      { icon: "📚", title: "Public library card", subtitle: "Free · Open today", tag: "Education", tagClass: "education" },
      { icon: "🎉", title: "Community events", subtitle: "Free activities nearby", tag: "Community", tagClass: "community" },
    ],
  },
  familiar: {
    rolePill: "Already Familiar",
    titleLine1: "Welcome back to your",
    titleLine2: "neighborhood.",
    aiMessage: "Here are updates from your saved places and nearby services.",
    forYouItems: [
      { icon: "🛍️", title: "Favorite market update", subtitle: "Open late this week", tag: "Shopping", tagClass: "education" },
      { icon: "🚌", title: "Transit advisory", subtitle: "Weekend route changes", tag: "Transit", tagClass: "community" },
      { icon: "🏫", title: "School district notice", subtitle: "Registration opens Monday", tag: "Education", tagClass: "health" },
    ],
  },
  refugee: {
    rolePill: "Refugee",
    titleLine1: "Welcome. We are here",
    titleLine2: "to support you.",
    aiMessage: "Nearby services for housing, legal support, and food are available now.",
    forYouItems: [
      { icon: "🏠", title: "Emergency housing desk", subtitle: "Open now · Walk-ins welcome", tag: "Housing", tagClass: "health" },
      { icon: "⚖️", title: "Legal support clinic", subtitle: "Free consultation today", tag: "Legal", tagClass: "community" },
      { icon: "🫶", title: "Mutual aid hub", subtitle: "Food and essentials pickup", tag: "Support", tagClass: "education" },
    ],
  },
};

export default function HomeScreen({ userType = "neighbor", onNavigate }) {
  const homeContent = homeContentByUserType[userType] || homeContentByUserType.neighbor;

  return (
    <main className={`visitor-page visitor-page--${userType}`}>
      <section className="visitor-content">
        <header className="visitor-header">
          <p className="visitor-date">SATURDAY, APRIL 25</p>
          <h1 className="visitor-title">
            {homeContent.titleLine1}
            <br />
            {homeContent.titleLine2}
          </h1>
          <span className="visitor-role-pill">● {homeContent.rolePill}</span>
        </header>

        <article className="visitor-ai-card">
          <p className="visitor-ai-label">AI ASSISTANT</p>
          <p className="visitor-ai-message">{homeContent.aiMessage}</p>
          <button type="button" className="visitor-learn-more">
            Learn more
          </button>
        </article>

        <section className="visitor-for-you">
          <h2 className="visitor-section-title">FOR YOU</h2>
          <div className="visitor-list">
            {homeContent.forYouItems.map((item) => (
              <article key={item.title} className="visitor-item-card">
                <span className="visitor-item-icon-wrap" aria-hidden>
                  <span className="visitor-item-icon">{item.icon}</span>
                </span>
                <div className="visitor-item-copy">
                  <p className="visitor-item-title">{item.title}</p>
                  <p className="visitor-item-subtitle">{item.subtitle}</p>
                  <span className={`visitor-item-tag ${item.tagClass}`}>{item.tag}</span>
                </div>
                <span className="visitor-bookmark" aria-hidden>
                  ♡
                </span>
              </article>
            ))}
          </div>
        </section>
      </section>

      <nav className="visitor-bottom-nav" aria-label="Primary">
        <div className="visitor-nav-item active">
          <button type="button" className="visitor-nav-icon-button" aria-label="Home">
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.5 9.8V20h13V9.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="visitor-nav-label">Home</span>
        </div>
        <div className="visitor-nav-item">
          <button
            type="button"
            className="visitor-nav-icon-button"
            aria-label="Map"
            onClick={() => onNavigate?.("map")}
          >
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <span className="visitor-nav-label">Map</span>
        </div>
        <div className="visitor-nav-item">
          <button type="button" className="visitor-nav-icon-button" aria-label="Ask">
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-5 4v-13.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="visitor-nav-label">Ask</span>
        </div>
        <div className="visitor-nav-item">
          <button type="button" className="visitor-nav-icon-button" aria-label="Saved">
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="visitor-nav-label">Saved</span>
        </div>
        <div className="visitor-nav-item">
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
