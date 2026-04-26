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

import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import VisitorFooterNav from "../components/VisitorFooterNav";

export default function SavedScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const persona = user?.persona_type ?? "neighbor";
  const savedItems = savedItemsByUserType[persona] || savedItemsByUserType.neighbor;

  return (
    <main className={`visitor-page visitor-page--${persona}`}>
      <section className="saved-content">
        <h1 className="saved-title">{t("saved.title")}</h1>
        <p className="saved-subtitle">{t("saved.subtitle")}</p>

        <section className="saved-list" aria-label={t("saved.ariaBookmarked")}>
          {savedItems.map((item) => (
            <article key={item.title} className="saved-item-card">
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
          ))}
        </section>
      </section>

      <VisitorFooterNav />
    </main>
  );
}
