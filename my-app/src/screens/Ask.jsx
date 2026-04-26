import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeExternalLinks from "rehype-external-links";
import VisitorFooterNav from "../components/VisitorFooterNav";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

function linkifyPlainUrls(text) {
  if (!text) return "";
  return text.replace(/(^|[\s(])((https?:\/\/[^\s)]+))/gi, (match, prefix, url) => `${prefix}[${url}](${url})`);
}

function AssistantMessage({ text }) {
  const markdown = linkifyPlainUrls(text || "");
  return (
    <div className="ask-message-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSanitize,
          [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
        ]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

export default function AskScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const persona = user?.persona_type ?? "neighbor";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "seed-assistant",
      role: "assistant",
      text: t("ask.sample.assistant1"),
      shortText: t("ask.sample.assistant1"),
      citations: [],
      actions: [],
      resourceCards: [],
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const targetLanguage = useMemo(
    () => (user?.language_code || i18n.resolvedLanguage || i18n.language || "en").split("-")[0],
    [user?.language_code, i18n.resolvedLanguage, i18n.language]
  );

  async function sendMessage(rawPrompt) {
    const prompt = rawPrompt.trim();
    if (!prompt || isSending) return;
    const userMessage = { id: `user-${Date.now()}`, role: "user", text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setErrorMessage("");
    setIsSending(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          language_code: targetLanguage,
          persona_type: persona,
          screen_context: { screen: "ask" },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "chat_request_failed");
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: data?.answer || t("common.tryAgain", { defaultValue: "Please try again." }),
          shortText:
            data?.answer_short ||
            data?.answer ||
            t("common.tryAgain", { defaultValue: "Please try again." }),
          citations: data?.citations || [],
          actions: data?.actions || [],
          resourceCards: data?.resource_cards || [],
        },
      ]);
    } catch (error) {
      setErrorMessage(
        t("ask.error", {
          defaultValue: "I couldn't fetch an answer right now. Please try again.",
        })
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleAction(action) {
    if (!action?.type) return;
    if (action.type === "open_category" && action.route) {
      window.open(action.route, "_blank", "noopener,noreferrer");
      return;
    }
    if (action.type === "open_map") {
      window.open(action.route || "/map", "_blank", "noopener,noreferrer");
      return;
    }
    if (action.type === "open_resource_link" && action.route) {
      window.open(action.route, "_blank", "noopener,noreferrer");
      return;
    }
    if (action.type === "call_hotline") {
      const phone = action?.params?.phone || action?.label || "";
      if (phone) window.location.href = `tel:${phone}`;
    }
  }

  return (
    <main className={`visitor-page visitor-page--${persona}`}>
      <section className="ask-content">
        <header className="ask-header">
          <h1 className="ask-title">{t("ask.title")}</h1>
          <p className="ask-subtitle">{t("ask.subtitle")}</p>
          <p className="ask-translated-indicator">{t("common.autoTranslated", { defaultValue: "Auto-translated" })}</p>
        </header>

        <section className="ask-chat-card">
          <section className="ask-chat">
            {messages.map((msg) => (
              <article
                key={msg.id}
                className={`ask-bubble ${msg.role === "assistant" ? "ask-bubble-assistant" : "ask-bubble-user"}`}
              >
                {msg.role === "assistant" ? (
                  <AssistantMessage text={msg.text || msg.shortText} />
                ) : (
                  <p className="ask-message-text">{msg.text}</p>
                )}
                {msg.role === "assistant" && (msg.resourceCards || []).length > 0 ? (
                  <div className="ask-resource-cards">
                    {(msg.resourceCards || []).map((card, index) => (
                      <article key={`${msg.id}-card-${index}`} className="ask-resource-card">
                        <p className="ask-resource-title">{card.title}</p>
                        {card.snippet ? <p className="ask-resource-snippet">{card.snippet}</p> : null}
                        {card.url ? (
                          <button
                            type="button"
                            className="ask-resource-open"
                            onClick={() =>
                              handleAction({ type: "open_resource_link", route: card.url, label: "Open resource" })
                            }
                          >
                            {t("ask.openResource", { defaultValue: "Open resource" })}
                          </button>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : null}
                {msg.role === "assistant" && (msg.citations || []).length > 0 ? (
                  <div className="ask-citations">
                    {(msg.citations || []).slice(0, 4).map((citation) => (
                      <a
                        key={citation.id}
                        className="ask-citation-link"
                        href={citation.url || "#"}
                        target={citation.url ? "_blank" : undefined}
                        rel={citation.url ? "noopener noreferrer" : undefined}
                        onClick={(event) => {
                          if (!citation.url) event.preventDefault();
                        }}
                      >
                        {citation.title || t("ask.source", { defaultValue: "Source" })}
                      </a>
                    ))}
                  </div>
                ) : null}
                {msg.role === "assistant" && (msg.actions || []).length > 0 ? (
                  <div className="ask-actions">
                    {(msg.actions || []).map((action, index) => (
                      <button
                        key={`${msg.id}-action-${index}`}
                        type="button"
                        className="ask-action"
                        onClick={() => handleAction(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
            {isSending ? (
              <article className="ask-bubble ask-bubble-assistant">
                {t("common.loading", { defaultValue: "Loading..." })}
              </article>
            ) : null}
          </section>
        </section>

        {errorMessage ? <p className="ask-error">{errorMessage}</p> : null}

        <div className="ask-quick-prompts" aria-label={t("ask.suggestedPromptsAria")}>
          <button type="button" className="ask-chip" onClick={() => sendMessage(t("ask.promptFood"))}>
            {t("ask.promptFood")}
          </button>
          <button type="button" className="ask-chip" onClick={() => sendMessage(t("ask.promptClinic"))}>
            {t("ask.promptClinic")}
          </button>
          <button type="button" className="ask-chip" onClick={() => sendMessage(t("ask.promptHousing"))}>
            {t("ask.promptHousing")}
          </button>
        </div>

        <div className="ask-input-wrap">
          <input
            className="ask-input"
            placeholder={t("ask.inputPlaceholder")}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                sendMessage(input);
              }
            }}
            disabled={isSending}
          />
          <button
            type="button"
            className="ask-send-button"
            aria-label={t("ask.sendAria")}
            onClick={() => sendMessage(input)}
            disabled={isSending}
          >
            ↑
          </button>
        </div>
      </section>

      <VisitorFooterNav />
    </main>
  );
}
