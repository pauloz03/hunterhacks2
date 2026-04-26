import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import VisitorFooterNav from "../components/VisitorFooterNav";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

function formatSlug(slug) {
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ── Main screen ───────────────────────────────────────────────────────────────
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
                    {formatSlug(cat.slug)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>

      <VisitorFooterNav />
    </main>
  );
}
