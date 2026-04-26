import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import VisitorFooterNav from "../components/VisitorFooterNav";
import { translateText } from "../lib/translateClient";

export default function AskScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const persona = user?.persona_type ?? "neighbor";
  const [translatedAssistant1, setTranslatedAssistant1] = useState(t("ask.sample.assistant1"));
  const [translatedAssistant2, setTranslatedAssistant2] = useState(t("ask.sample.assistant2"));
  const [showAutoTranslatedLabel, setShowAutoTranslatedLabel] = useState(false);

  useEffect(() => {
    const target = user?.language_code || i18n.language || "en";
    const localLanguage = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
    const targetLanguage = target.split("-")[0];

    const assistant1 = t("ask.sample.assistant1");
    const assistant2 = t("ask.sample.assistant2");

    if (targetLanguage === localLanguage) {
      setTranslatedAssistant1(assistant1);
      setTranslatedAssistant2(assistant2);
      setShowAutoTranslatedLabel(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const [first, second] = await Promise.all([
        translateText({ text: assistant1, target: targetLanguage }),
        translateText({ text: assistant2, target: targetLanguage }),
      ]);
      if (cancelled) return;
      setTranslatedAssistant1(first.translatedText || assistant1);
      setTranslatedAssistant2(second.translatedText || assistant2);
      setShowAutoTranslatedLabel(Boolean(first.translated || second.translated));
    })();

    return () => {
      cancelled = true;
    };
  }, [t, i18n.language, i18n.resolvedLanguage, user?.language_code]);

  return (
    <main className={`visitor-page visitor-page--${persona}`}>
      <section className="ask-content">
        <header className="ask-header">
          <h1 className="ask-title">{t("ask.title")}</h1>
          <p className="ask-subtitle">{t("ask.subtitle")}</p>
          {showAutoTranslatedLabel ? (
            <p className="ask-translated-indicator">{t("common.autoTranslated", { defaultValue: "Auto-translated" })}</p>
          ) : null}
        </header>

        <section className="ask-chat">
          <article className="ask-bubble ask-bubble-assistant">
            {translatedAssistant1}
          </article>
          <article className="ask-bubble ask-bubble-user">{t("ask.sample.user1")}</article>
          <article className="ask-bubble ask-bubble-assistant">
            {translatedAssistant2}
          </article>
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
