import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import VisitorFooterNav from "../components/VisitorFooterNav";
import guideData from "./guideData.json";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const PERSONA_ORDER = {
  visitor:   ["transit", "health", "banking", "community", "emergency"],
  neighbor:  ["community", "transit", "food", "school", "housing", "banking", "health", "emergency"],
  immigrant: ["health", "food", "legal-rights", "school", "housing", "work", "banking", "transit", "community", "emergency"],
  refugee:   ["emergency", "food", "health", "legal-rights", "housing", "community", "banking", "transit", "school", "work"],
  student:   ["housing", "banking", "work", "transit", "health", "community", "emergency"],
  familiar:  ["community", "transit", "food", "housing", "banking", "health", "emergency"],
};

const ALL_CATEGORIES = [
  { id: "transit",       slug: "transit",       icon: "🚇" },
  { id: "health",        slug: "health",        icon: "🏥" },
  { id: "banking",       slug: "banking",       icon: "🏦" },
  { id: "community",     slug: "community",     icon: "🤝" },
  { id: "emergency",     slug: "emergency",     icon: "🚨" },
  { id: "food",          slug: "food",          icon: "🍽️" },
  { id: "school",        slug: "school",        icon: "📚" },
  { id: "housing",       slug: "housing",       icon: "🏠" },
  { id: "legal-rights",  slug: "legal-rights",  icon: "⚖️" },
  { id: "work",          slug: "work",          icon: "💼" },
];

const EXTRA_SERVICES = [
  { icon: "🗺️", navKey: "map", route: "/map" },
  { icon: "💬", navKey: "ask", route: "/ask" },
];

const SLUG_TO_GUIDE_ID = {
  transit: "getting-around",
  health: "finding-a-doctor",
  banking: "banking-money",
  community: "community",
  emergency: "emergency",
  food: "finding-food",
  school: "enrolling-kids",
  housing: "housing-basics",
  "legal-rights": "know-your-rights",
  work: "finding-work",
};

function formatSlug(slug) {
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const moreModalStyles = `
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes slideDown {
    from { transform: translateY(0); }
    to   { transform: translateY(100%); }
  }
`;

function MoreModal({ onClose, navigate, categories, t, onCategorySelect }) {
  const [closing, setClosing] = useState(false);

  function handleClose() {
    setClosing(true);
    setTimeout(onClose, 300);
  }

  const allServices = [
    ...categories.map(cat => ({
      icon: cat.icon,
      label: t(`home.categoryLabel.${cat.slug}`, { defaultValue: formatSlug(cat.slug) }),
      action: () => onCategorySelect(cat),
    })),
    ...EXTRA_SERVICES.map(s => ({
      icon: s.icon,
      label: t(`nav.${s.navKey}`, { defaultValue: formatSlug(s.navKey) }),
      action: () => navigate(s.route),
    })),
  ];

  return (
    <>
      <style>{moreModalStyles}</style>
      <div style={{
        position: "fixed", inset: 0, background: "#f7f8f6",
        zIndex: 1000, display: "flex", flexDirection: "column",
        animation: `${closing ? "slideDown" : "slideUp"} 0.32s cubic-bezier(0.32,0.72,0,1) ${closing ? "forwards" : ""}`,
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 16px", borderBottom: "1px solid #ebebeb",
          background: "#fff",
        }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#1a1a1a" }}>
            {t("home.allServices", { defaultValue: "All services" })}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "#ebebeb", border: "none", borderRadius: "50%",
              width: 32, height: 32, cursor: "pointer", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center", color: "#555",
            }}
          >×</button>
        </div>

        {/* Service list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
          {allServices.map((s, i) => (
            <button
              key={i}
              onClick={() => { handleClose(); setTimeout(s.action, 300); }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "#fff", border: "none", borderRadius: 14,
                padding: "14px 16px", cursor: "pointer", textAlign: "left",
                width: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{s.label}</span>
              <span style={{ marginLeft: "auto", color: "#aaa", fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function CategoryModal({ category, onClose, t }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const guideId = SLUG_TO_GUIDE_ID[category?.slug];
  const guideCategory = guideData.categories.find((entry) => entry.id === guideId);
  const categoryTitle = t(`home.categoryLabel.${category.slug}`, { defaultValue: formatSlug(category.slug) });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.45)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "82vh",
          overflowY: "auto",
          background: "#f7f8f6",
          borderRadius: 20,
          boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
          paddingBottom: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "18px 16px 12px",
            background: "#fff",
            borderBottom: "1px solid #e8ece8",
            position: "sticky",
            top: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>{category.icon || "📋"}</span>
            <h3 style={{ margin: 0, fontSize: 18, color: "#1d3228" }}>{categoryTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "#ebefeb",
              width: 32,
              height: 32,
              borderRadius: "50%",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "14px 14px 0" }}>
          {!guideCategory ? (
            <p style={{ margin: 0, color: "#6a776f" }}>
              {t("category.noGuides", { defaultValue: "No guides available yet." })}
            </p>
          ) : (
            guideCategory.topics.map((topic, index) => (
              <button
                type="button"
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                style={{
                  width: "100%",
                  border: "none",
                  background: "#fff",
                  borderRadius: 14,
                  padding: "13px 14px",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "var(--persona-soft-bg, #e8f4f0)",
                    color: "#1f6c57",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                <span style={{ flex: 1, color: "#1d3228", fontSize: 14, lineHeight: 1.35 }}>{topic.title}</span>
                <span style={{ color: "#809286", fontSize: 17 }}>›</span>
              </button>
            ))
          )}
        </div>

        {selectedTopic ? (
          <div style={{ margin: "8px 14px 0", borderRadius: 14, background: "#fff", padding: "14px 14px 8px" }}>
            <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 10 }}>
              <div>
                <p style={{ margin: 0, color: "#5d6c63", fontSize: 12 }}>
                  {t("category.readTime", { defaultValue: "{{time}} read", time: selectedTopic.readTime })}
                </p>
                <h4 style={{ margin: "4px 0 0", fontSize: 16, color: "#1d3228" }}>{selectedTopic.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: "#6f7f75" }}
              >
                ×
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              {selectedTopic.steps.map((step, idx) => (
                <div key={`${selectedTopic.id}-step-${idx}`} style={{ marginBottom: 12 }}>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#264437", fontSize: 13 }}>
                    {idx + 1}. {step.title}
                  </p>
                  <p style={{ margin: 0, color: "#4e6056", fontSize: 13, lineHeight: 1.55 }}>{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
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
  const [showMore, setShowMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    const persona = user.persona_type ?? "neighbor";
    setPersonaType(persona);
    const categoriesPersona = persona === "familiar" ? "neighbor" : persona;

    async function load() {
      const order = PERSONA_ORDER[persona] ?? PERSONA_ORDER.neighbor;

      function sortByPersona(cats) {
        return [...cats].sort((a, b) => {
          const ai = order.indexOf(a.slug);
          const bi = order.indexOf(b.slug);
          return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
        });
      }

      try {
        const res = await fetch(`${BACKEND_URL}/categories?persona_type=${categoriesPersona}`);
        const data = await res.json();
        if (res.ok && (data.categories ?? []).length > 0) {
          setCategories(sortByPersona(data.categories));
          setLoading(false);
          return;
        }
      } catch {
        // backend unreachable — fall through to local fallback
      }

      // Fallback: hardcoded categories filtered and ordered by persona
      const fallback = ALL_CATEGORIES.filter((c) => order.includes(c.slug));
      setCategories(sortByPersona(fallback));
      setLoading(false);
    }

    load();
  }, [user?.id, user?.persona_type]);

  const persona = personaType ?? "neighbor";
  const isFamiliarUser = persona === "familiar";
  const greetingLine1 = isFamiliarUser
    ? "Welcome back"
    : t(`home.greeting.${persona}.line1`, { defaultValue: t("home.greeting.neighbor.line1") });
  const greetingLine2 = isFamiliarUser
    ? ""
    : t(`home.greeting.${persona}.line2`, { defaultValue: t("home.greeting.neighbor.line2") });
  const dateLocale = i18n.resolvedLanguage || i18n.language || "en-US";
  let today = "";
  try {
    today = new Intl.DateTimeFormat(dateLocale, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());
  } catch {
    today = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }

  return (
    <main
      className={`visitor-page visitor-page--${persona}`}
      style={
        isFamiliarUser
          ? {
              "--persona-accent": "#5B4FCF",
              "--persona-soft-bg": "color-mix(in srgb, #5B4FCF 18%, white)",
            }
          : undefined
      }
    >
      <section className="visitor-content">
        <header className="visitor-header">
          <p className="visitor-date">{today.toUpperCase()}</p>
          <h1 className="visitor-title">
            {greetingLine1}
            {greetingLine2 ? <br /> : null}
            {greetingLine2}
          </h1>
          <span className="visitor-role-pill">
            ● {isFamiliarUser ? "NYC Local" : t(`home.persona.${persona}`, { defaultValue: t("home.persona.neighbor") })}
          </span>
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
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px 8px",
              padding: "4px 2px",
            }}>
              {categories.map((cat) => (
                <button
                  key={cat.id ?? cat.slug}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: "none", border: "none", padding: 0,
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 6,
                  }}
                >
                  <div style={{
                    width: 60, height: 60, borderRadius: 16,
                    background: "var(--persona-soft-bg, #e8f4f0)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}>
                    {cat.icon}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 500, color: "#333",
                    textAlign: "center", lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}>
                    {t(`home.categoryLabel.${cat.slug}`, { defaultValue: formatSlug(cat.slug) })}
                  </span>
                </button>
              ))}

              {/* More button */}
              <button
                onClick={() => setShowMore(true)}
                style={{
                  background: "none", border: "none", padding: 0,
                  cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 6,
                }}
              >
                <div style={{
                  width: 60, height: 60, borderRadius: 16,
                  background: "var(--persona-soft-bg, #e8f4f0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  letterSpacing: 2, color: "#555",
                }}>
                  •••
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 500, color: "#333",
                  textAlign: "center", lineHeight: 1.3,
                }}>
                  {t("home.more", { defaultValue: "More" })}
                </span>
              </button>
            </div>
          )}
        </section>
      </section>

      <VisitorFooterNav />

      {showMore && (
        <MoreModal
          onClose={() => setShowMore(false)}
          navigate={navigate}
          categories={ALL_CATEGORIES}
          t={t}
          onCategorySelect={(cat) => {
            setShowMore(false);
            setSelectedCategory(cat);
          }}
        />
      )}
      {selectedCategory ? (
        <CategoryModal category={selectedCategory} onClose={() => setSelectedCategory(null)} t={t} />
      ) : null}
    </main>
  );
}
