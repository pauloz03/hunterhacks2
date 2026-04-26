const savedItemsByUserType = {
  visitor: [
    { icon: "⚖️", titleKey: "visitorLegalAid", subtitleKey: "distance09", typeKey: "legal" },
    { icon: "🏥", titleKey: "visitorUrgentCare", subtitleKey: "distance13", typeKey: "health" },
  ],
  neighbor: [
    { icon: "🏥", titleKey: "neighborClinic", subtitleKey: "distance07", typeKey: "health" },
    { icon: "📚", titleKey: "neighborLibrary", subtitleKey: "distance11", typeKey: "education" },
  ],
  familiar: [
    { icon: "🍽️", titleKey: "familiarPantry", subtitleKey: "distance06", typeKey: "food" },
    { icon: "🚌", titleKey: "familiarTransitDesk", subtitleKey: "distance18", typeKey: "transit" },
  ],
  refugee: [
    { icon: "🏠", titleKey: "refugeeHousing", subtitleKey: "distance08", typeKey: "housing" },
    { icon: "⚖️", titleKey: "refugeeLegal", subtitleKey: "distance12", typeKey: "legal" },
  ],
};

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import VisitorFooterNav from "../components/VisitorFooterNav";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function SavedScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const persona = user?.persona_type ?? "neighbor";
  const [savedResources, setSavedResources] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedResources() {
      if (!user?.id) {
        setSavedResources([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/users/saved?user_id=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        if (!cancelled && res.ok) {
          setSavedResources(data.resources || []);
        }
      } catch {
        if (!cancelled) {
          setSavedResources([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSavedResources();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const fallbackItems = savedItemsByUserType[persona] || savedItemsByUserType.neighbor;

  return (
    <main className={`visitor-page visitor-page--${persona}`}>
      <section className="saved-content">
        <h1 className="saved-title">{t("saved.title")}</h1>

        <section className="saved-list" aria-label={t("saved.ariaBookmarked")}>
          {loading ? <p className="saved-item-subtitle">Loading…</p> : null}
          {!loading && savedResources.length > 0
            ? savedResources.map((item) => (
                <article key={item.id} className="saved-item-card">
                  <span className="saved-item-icon" aria-hidden>
                    📍
                  </span>
                  <div className="saved-item-copy">
                    <p className="saved-item-title">{item.name}</p>
                    <p className="saved-item-subtitle">{item.address || item.neighborhood || ""}</p>
                    <span className="saved-item-type">{item.category || "resource"}</span>
                  </div>
                  <span className="saved-item-bookmark" aria-hidden>
                    ♥
                  </span>
                </article>
              ))
            : null}
          {!loading && savedResources.length === 0
            ? fallbackItems.map((item) => (
                <article key={item.titleKey} className="saved-item-card">
                  <span className="saved-item-icon" aria-hidden>
                    {item.icon}
                  </span>
                  <div className="saved-item-copy">
                    <p className="saved-item-title">{t(`saved.items.title.${item.titleKey}`)}</p>
                    <p className="saved-item-subtitle">{t(`saved.items.subtitle.${item.subtitleKey}`)}</p>
                    <span className="saved-item-type">{t(`saved.items.type.${item.typeKey}`)}</span>
                  </div>
                  <span className="saved-item-bookmark" aria-hidden>
                    ♥
                  </span>
                </article>
              ))
            : null}
        </section>
      </section>

      <VisitorFooterNav />
    </main>
  );
}
