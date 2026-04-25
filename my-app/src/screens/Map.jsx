export default function MapScreen({ userType = "neighbor", onNavigate }) {
  return (
    <main className={`visitor-page visitor-page--${userType}`}>
      <section className="map-content">
        <h1 className="map-title">Nearby resources</h1>

        <div className="map-search" role="search">
          <span aria-hidden className="map-search-icon">
            ⌕
          </span>
          <span className="map-search-placeholder">Search services near you...</span>
        </div>

        <div className="map-filters" aria-label="Resource categories">
          <button type="button" className="map-filter active">
            All
          </button>
          <button type="button" className="map-filter">
            Health
          </button>
          <button type="button" className="map-filter">
            Legal
          </button>
          <button type="button" className="map-filter">
            Food
          </button>
          <button type="button" className="map-filter">
            Housing
          </button>
        </div>

        <section className="map-surface" aria-label="Temporary map">
          <div className="map-grid" />

          <span className="map-marker map-marker-book">📚</span>
          <span className="map-marker map-marker-health">🏥</span>
          <span className="map-marker map-marker-housing">🏠</span>
          <span className="map-marker map-marker-legal">⚖️</span>
          <span className="map-marker map-marker-food">🍽️</span>
          <span className="map-marker map-marker-med">💊</span>

          <span className="map-user-location" aria-hidden>
            <span className="map-user-ring" />
            <span className="map-user-dot" />
          </span>
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
        <div className="visitor-nav-item active">
          <button type="button" className="visitor-nav-icon-button" aria-label="Map">
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
