const forYouItems = [
  { icon: "🏥", title: "Local health clinic", subtitle: "Sliding scale fees", tag: "Health", tagClass: "health" },
  { icon: "📚", title: "Public library card", subtitle: "Free · Open today", tag: "Education", tagClass: "education" },
  { icon: "🎉", title: "Community events", subtitle: "Free activities nearby", tag: "Community", tagClass: "community" },
];

export default function NewNeighborHomescreen() {
  return (
    <main className="visitor-page">
      <section className="visitor-content">
        <header className="visitor-header">
          <p className="visitor-date">SATURDAY, APRIL 25</p>
          <h1 className="visitor-title">
            Welcome to your new
            <br />
            neighborhood.
          </h1>
          <span className="visitor-role-pill">● New Neighbor</span>
        </header>

        <article className="visitor-ai-card">
          <p className="visitor-ai-label">AI ASSISTANT</p>
          <p className="visitor-ai-message">Your local community board meeting is tomorrow at 7pm.</p>
          <button type="button" className="visitor-learn-more">
            Learn more
          </button>
        </article>

        <section className="visitor-for-you">
          <h2 className="visitor-section-title">FOR YOU</h2>
          <div className="visitor-list">
            {forYouItems.map((item) => (
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
