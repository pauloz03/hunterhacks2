import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import VisitorFooterNav from "../components/VisitorFooterNav";

export default function AskScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const persona = user?.persona_type ?? "neighbor";

  return (
    <main className={`visitor-page visitor-page--${persona}`}>
      <section className="ask-content">
        <header className="ask-header">
          <h1 className="ask-title">{t("ask.title")}</h1>
          <p className="ask-subtitle">{t("ask.subtitle")}</p>
        </header>

        <section className="ask-chat-card">
          <section className="ask-chat">
            <article className="ask-bubble ask-bubble-assistant">
              {t("ask.sample.assistant1")}
            </article>
            <article className="ask-bubble ask-bubble-user">{t("ask.sample.user1")}</article>
            <article className="ask-bubble ask-bubble-assistant">
              {t("ask.sample.assistant2")}
            </article>
          </section>
        </section>

        <div className="ask-quick-prompts" aria-label={t("ask.suggestedPromptsAria")}>
          <button type="button" className="ask-chip">
            {t("ask.promptFood")}
          </button>
          <button type="button" className="ask-chip">
            {t("ask.promptClinic")}
          </button>
          <button type="button" className="ask-chip">
            {t("ask.promptHousing")}
          </button>
        </div>

        <div className="ask-input-wrap">
          <input className="ask-input" placeholder={t("ask.inputPlaceholder")} />
          <button type="button" className="ask-send-button" aria-label={t("ask.sendAria")}>
            ↑
          </button>
        </div>
      </section>

      <VisitorFooterNav />
    </main>
  );
}
