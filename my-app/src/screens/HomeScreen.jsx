import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import VisitorFooterNav from "../components/VisitorFooterNav";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const EXTRA_SERVICES = [
  { icon: "🗺️", navKey: "map", route: "/map" },
  { icon: "💬", navKey: "ask", route: "/ask" },
];

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

function MoreModal({ onClose, navigate, categories, t }) {
  const [closing, setClosing] = useState(false);

  function handleClose() {
    setClosing(true);
    setTimeout(onClose, 300);
  }

  const allServices = [
    ...categories.map(cat => ({
      icon: cat.icon,
      label: t(`home.categoryLabel.${cat.slug}`, { defaultValue: formatSlug(cat.slug) }),
      action: () => navigate(`/category/${cat.slug}`, { state: { cat } }),
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [personaType, setPersonaType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const persona = user.persona_type ?? "neighbor";
    setPersonaType(persona);

    async function load() {
      try {
        const res = await fetch(`${BACKEND_URL}/categories?persona_type=${persona}`);
        const data = await res.json();
        if (res.ok) {
          const cats = (data.categories ?? []).sort(
            (a, b) => (a.priority_order ?? 0) - (b.priority_order ?? 0)
          );
          setCategories(cats);
        }
      } catch {
        // backend unreachable
      }
      setLoading(false);
    }

    load();
  }, [user?.id, user?.persona_type]);

  const persona = personaType ?? "neighbor";
  const greetingLine1 = t(`home.greeting.${persona}.line1`, { defaultValue: t("home.greeting.neighbor.line1") });
  const greetingLine2 = t(`home.greeting.${persona}.line2`, { defaultValue: t("home.greeting.neighbor.line2") });
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
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px 8px",
              padding: "4px 2px",
            }}>
              {categories.map((cat) => (
                <button
                  key={cat.id ?? cat.slug}
                  onClick={() => navigate(`/category/${cat.slug}`, { state: { cat } })}
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

      {showMore && <MoreModal onClose={() => setShowMore(false)} navigate={navigate} categories={categories} t={t} />}
    </main>
  );
}
