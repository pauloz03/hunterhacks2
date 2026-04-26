import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import VisitorFooterNav from "../components/VisitorFooterNav";
import guideData from "./guideData.json";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

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

// Map your category slugs to the guideData.json category IDs
const SLUG_TO_GUIDE_ID = {
  "transit":      "getting-around",
  "health":       "finding-a-doctor",
  "banking":      "banking-money",
  "community":    "community",
  "emergency":    "emergency",
  "food":         "finding-food",
  "school":       "enrolling-kids",
  "housing":      "housing-basics",
  "legal-rights": "know-your-rights",
  "work":         "finding-work",
};

const TEAL = {
  dark: "#085041",
  mid: "#0F6E56",
  light: "#E1F5EE",
  border: "#9FE1CB",
};

// ── Guide card modal (slides up from bottom) ──────────────────────────────────
function GuideCard({ topic, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: "20px 20px 0 0",
        width: "100%", maxWidth: 480, maxHeight: "85vh",
        overflowY: "auto", paddingBottom: 32,
        boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background: TEAL.mid, padding: "20px 20px 16px",
          borderRadius: "20px 20px 0 0", position: "sticky", top: 0, zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "0 0 4px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Guide
              </p>
              <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 600, margin: 0, lineHeight: 1.35 }}>
                {topic.title}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: "6px 0 0" }}>
                {topic.readTime} read
              </p>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.2)", border: "none",
              borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 18, flexShrink: 0,
            }}>×</button>
          </div>
        </div>

        {/* Steps */}
        <div style={{ padding: "20px 20px 0" }}>
          {topic.steps.map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: 14, paddingBottom: 16,
              borderBottom: i < topic.steps.length - 1 ? `1px solid ${TEAL.border}` : "none",
              marginBottom: i < topic.steps.length - 1 ? 16 : 0,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: TEAL.light, color: TEAL.dark,
                fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1,
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", margin: "0 0 4px" }}>
                  {step.title}
                </p>
                <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.6 }}>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tip */}
        {topic.tip && (
          <div style={{
            margin: "20px 20px 0", background: TEAL.light,
            borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: TEAL.mid, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pro tip</p>
              <p style={{ fontSize: 13, color: TEAL.dark, margin: 0, lineHeight: 1.55 }}>{topic.tip}</p>
            </div>
          </div>
        )}

        {/* Tags */}
        {topic.tags && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "16px 20px 0" }}>
            {topic.tags.map((tag, i) => (
              <span key={i} style={{
                fontSize: 12, padding: "4px 12px", borderRadius: 20,
                background: TEAL.light, color: TEAL.dark, fontWeight: 500,
              }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Expandable category row with topic links ──────────────────────────────────
function CategoryRow({ cat, onSelectTopic }) {
  const [open, setOpen] = useState(false);

  // Find the matching guide category from guideData.json
  const guideId = SLUG_TO_GUIDE_ID[cat.slug];
  const guideCategory = guideData.categories.find(c => c.id === guideId);

  return (
    <article key={cat.id} className="visitor-item-card" style={{ flexDirection: "column", alignItems: "stretch", padding: 0 }}>
      {/* Main row — tapping toggles the dropdown */}
      <div
        className="visitor-item-card-inner"
        style={{ display: "flex", alignItems: "center", padding: "14px 16px", cursor: "pointer" }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="visitor-item-icon-wrap" aria-hidden>
          <span className="visitor-item-icon">{cat.icon}</span>
        </span>
        <div className="visitor-item-copy" style={{ flex: 1 }}>
          <p className="visitor-item-title">{cat.label}</p>
        </div>
        <span style={{ color: TEAL.mid, fontSize: 18, transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "none" }}>›</span>
      </div>

      {/* Dropdown topic list */}
      {open && guideCategory && (
        <div style={{ borderTop: "1px solid #ebebeb" }}>
          {guideCategory.topics.map((topic, i) => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              style={{
                width: "100%", background: "transparent", border: "none",
                borderBottom: i < guideCategory.topics.length - 1 ? "1px solid #ebebeb" : "none",
                padding: "11px 16px 11px 60px",
                display: "flex", alignItems: "center", gap: 10,
                cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{ flex: 1, fontSize: 13, color: "#444", lineHeight: 1.4 }}>{topic.title}</span>
              <span style={{ color: TEAL.mid, fontSize: 14 }}>›</span>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [personaType, setPersonaType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);

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
  const greetingLine1 = t(`home.greeting.${persona}.line1`, { defaultValue: t("home.greeting.neighbor.line1") });
  const greetingLine2 = t(`home.greeting.${persona}.line2`, { defaultValue: t("home.greeting.neighbor.line2") });
  const localeMap = {
    en: "en-US", es: "es-ES", zh: "zh-CN", ar: "ar",
    fr: "fr-FR", bn: "bn-BD", ru: "ru-RU",
  };
  const today = new Date().toLocaleDateString(localeMap[i18n.language] || "en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <main className={`visitor-page visitor-page--${persona}`}>
      <section className="visitor-content">
        <header className="visitor-header">
          <p className="visitor-date">{today.toUpperCase()}</p>
          <h1 className="visitor-title">
            {greetingLine1}<br />{greetingLine2}
          </h1>
          <span className="visitor-role-pill">● {t(`home.persona.${persona}`, { defaultValue: t("home.persona.neighbor") })}</span>
        </header>

        <article className="visitor-ai-card">
          <p className="visitor-ai-label">{t("home.aiAssistantLabel")}</p>
          <p className="visitor-ai-message">{t(`home.aiMessage.${persona}`, { defaultValue: t("home.aiMessage.neighbor") })}</p>
          <button type="button" className="visitor-learn-more" onClick={() => navigate("/ask")}>
            {t("home.learnMore")}
          </button>
        </article>

        <section className="visitor-for-you">
          <h2 className="visitor-section-title">{t("home.forYou")}</h2>

          {loading ? (
            <p style={{ color: "var(--persona-accent)" }}>{t("common.loading")}</p>
          ) : categories.length === 0 ? (
            <p style={{ color: "#7d7672" }}>{t("home.noResources")}</p>
          ) : (
            <div className="visitor-list">
              {categories.map((cat) => (
                <CategoryRow key={cat.id} cat={cat} onSelectTopic={setSelectedTopic} />
              ))}
            </div>
          )}
        </section>
      </section>

      <VisitorFooterNav />

      {/* Guide card modal */}
      {selectedTopic && (
        <GuideCard topic={selectedTopic} onClose={() => setSelectedTopic(null)} />
      )}
    </main>
  );
}
