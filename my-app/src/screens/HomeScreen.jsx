import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const SLUG_LABELS = {
  transit:       "Getting Around",
  health:        "Finding a Doctor",
  banking:       "Banking & Money",
  community:     "Community",
  emergency:     "Emergency Services",
  food:          "Finding Food",
  school:        "Enrolling Kids in School",
  housing:       "Housing Basics",
  "legal-rights": "Know Your Rights",
  work:          "Finding Work",
};

const ALL_CATEGORIES = [
  { id: "transit",      slug: "transit",      label: "Transit",      icon: "🚇", description: "Subway, bus, and getting around NYC" },
  { id: "health",       slug: "health",       label: "Health",       icon: "🏥", description: "Clinics, hospitals, and health services" },
  { id: "banking",      slug: "banking",      label: "Banking",      icon: "🏦", description: "Bank accounts, credit, and financial help" },
  { id: "community",    slug: "community",    label: "Community",    icon: "🤝", description: "Local events, groups, and neighbors" },
  { id: "emergency",    slug: "emergency",    label: "Emergency",    icon: "🚨", description: "Emergency services and crisis support" },
  { id: "food",         slug: "food",         label: "Food",         icon: "🍽️", description: "Food pantries, benefits, and resources" },
  { id: "school",       slug: "school",       label: "School",       icon: "📚", description: "Schools, enrollment, and education" },
  { id: "housing",      slug: "housing",      label: "Housing",      icon: "🏠", description: "Shelter, rentals, and housing assistance" },
  { id: "legal-rights", slug: "legal-rights", label: "Legal Rights", icon: "⚖️", description: "Know your rights and legal aid" },
  { id: "work",         slug: "work",         label: "Work",         icon: "💼", description: "Jobs, permits, and employment support" },
];

const PERSONA_ORDER = {
  visitor:   ["transit", "health", "banking", "community", "emergency"],
  neighbor:  ["community", "transit", "food", "school", "housing", "banking", "health", "emergency"],
  immigrant: ["health", "food", "legal-rights", "school", "housing", "work", "banking", "transit", "community", "emergency"],
  refugee:   ["emergency", "food", "health", "legal-rights", "housing", "community", "banking", "transit", "school", "work"],
  student:   ["housing", "banking", "work", "transit", "health", "community", "emergency"],
};

const PERSONA_LABELS = {
  visitor:   "Visitor",
  neighbor:  "New Neighbor",
  immigrant: "Immigrant",
  refugee:   "Refugee",
  student:   "Student",
};

const PERSONA_GREETING = {
  visitor:   ["Welcome to your", "visit."],
  neighbor:  ["Welcome to your new", "neighborhood."],
  immigrant: ["Welcome. We're here", "to help you settle."],
  refugee:   ["Welcome. We are here", "to support you."],
  student:   ["Welcome to your", "student life."],
};

const PERSONA_AI_MESSAGE = {
  visitor:   "Top transit tips and must-see events are ready for this week.",
  neighbor:  "Your local community board meeting is tomorrow at 7pm.",
  immigrant: "Key services for housing, legal support, and work are nearby.",
  refugee:   "Nearby services for housing, legal support, and food are available now.",
  student:   "Housing resources and campus services for students are listed below.",
};

export default function HomeScreen({ onNavigate }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [personaType, setPersonaType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const persona = user.persona_type ?? "neighbor";
    setPersonaType(persona);

    async function load() {
      let cats = [];
      try {
        const res = await fetch(`${BACKEND_URL}/categories?persona_type=${persona}`);
        const data = await res.json();
        if (res.ok) cats = data.categories ?? [];
      } catch {
        // backend unreachable — fall through to local fallback
      }

      const order = PERSONA_ORDER[persona] ?? [];
      const source = cats.length > 0 ? cats : ALL_CATEGORIES.filter((c) => order.includes(c.slug));
      const sorted = source.sort((a, b) => {
        const ai = order.indexOf(a.slug);
        const bi = order.indexOf(b.slug);
        return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
      });

      setCategories(sorted);
      setLoading(false);
    }

    load();
  }, [user?.id, user?.persona_type]);

  const persona = personaType ?? "neighbor";
  const greeting = PERSONA_GREETING[persona] ?? ["Welcome to your", "neighborhood."];
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className={`visitor-page visitor-page--${persona}`}>
      <section className="visitor-content">
        <header className="visitor-header">
          <p className="visitor-date">{today.toUpperCase()}</p>
          <h1 className="visitor-title">
            {greeting[0]}
            <br />
            {greeting[1]}
          </h1>
          <span className="visitor-role-pill">● {PERSONA_LABELS[persona]}</span>
        </header>

        <article className="visitor-ai-card">
          <p className="visitor-ai-label">AI ASSISTANT</p>
          <p className="visitor-ai-message">{PERSONA_AI_MESSAGE[persona]}</p>
          <button type="button" className="visitor-learn-more" onClick={() => onNavigate?.("ask")}>
            Learn more
          </button>
        </article>

        <section className="visitor-for-you">
          <h2 className="visitor-section-title">FOR YOU</h2>

          {loading ? (
            <p style={{ color: "var(--persona-accent)" }}>Loading…</p>
          ) : categories.length === 0 ? (
            <p style={{ color: "#7d7672" }}>No resources found.</p>
          ) : (
            <div className="visitor-list">
              {categories.map((cat) => (
                <article key={cat.id} className="visitor-item-card">
                  <span className="visitor-item-icon-wrap" aria-hidden>
                    <span className="visitor-item-icon">{cat.icon}</span>
                  </span>
                  <div className="visitor-item-copy">
                    <p className="visitor-item-title">{SLUG_LABELS[cat.slug] ?? cat.slug}</p>
                  </div>
                  <span className="visitor-bookmark" aria-hidden>♡</span>
                </article>
              ))}
            </div>
          )}
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
          <button type="button" className="visitor-nav-icon-button" aria-label="Map" onClick={() => onNavigate?.("map")}>
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <span className="visitor-nav-label">Map</span>
        </div>
        <div className="visitor-nav-item">
          <button type="button" className="visitor-nav-icon-button" aria-label="Ask" onClick={() => onNavigate?.("ask")}>
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-5 4v-13.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="visitor-nav-label">Ask</span>
        </div>
        <div className="visitor-nav-item">
          <button type="button" className="visitor-nav-icon-button" aria-label="Saved" onClick={() => onNavigate?.("saved")}>
            <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="visitor-nav-label">Saved</span>
        </div>
        <div className="visitor-nav-item">
          <button type="button" className="visitor-nav-icon-button" aria-label="Profile" onClick={() => onNavigate?.("profile")}>
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
