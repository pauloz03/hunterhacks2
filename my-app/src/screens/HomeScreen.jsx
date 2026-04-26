import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import VisitorFooterNav from "../components/VisitorFooterNav";

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

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const greetingLine1 = t(`home.greeting.${persona}.line1`, { defaultValue: t("home.greeting.neighbor.line1") });
  const greetingLine2 = t(`home.greeting.${persona}.line2`, { defaultValue: t("home.greeting.neighbor.line2") });
  const localeMap = {
    en: "en-US",
    es: "es-ES",
    zh: "zh-CN",
    ar: "ar",
    fr: "fr-FR",
    bn: "bn-BD",
    ru: "ru-RU",
  };
  const today = new Date().toLocaleDateString(localeMap[i18n.language] || "en-US", {
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
            {greetingLine1}
            <br />
            {greetingLine2}
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
                <article key={cat.id} className="visitor-item-card">
                  <span className="visitor-item-icon-wrap" aria-hidden>
                    <span className="visitor-item-icon">{cat.icon}</span>
                  </span>
                  <div className="visitor-item-copy">
                    <p className="visitor-item-title">{t(`home.categoryLabel.${cat.slug}`, { defaultValue: cat.slug })}</p>
                  </div>
                  <span className="visitor-bookmark" aria-hidden>♡</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <VisitorFooterNav />
    </main>
  );
}
