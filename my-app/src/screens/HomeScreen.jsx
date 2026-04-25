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

export default function HomeScreen({ userType = "neighbor" }) {
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
        <button type="button" className="visitor-nav-item active">
          <span>🏠</span>
          <span>Home</span>
        </button>
        <button type="button" className="visitor-nav-item">
          <span>📍</span>
          <span>Map</span>
        </button>
        <button type="button" className="visitor-nav-item">
          <span>💬</span>
          <span>Ask</span>
        </button>
        <button type="button" className="visitor-nav-item">
          <span>🔖</span>
          <span>Saved</span>
        </button>
        <button type="button" className="visitor-nav-item">
          <span>👤</span>
          <span>Profile</span>
        </button>
      </nav>
    </main>
  );
}
