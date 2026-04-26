const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const translationCache = new Map();

function buildCacheKey({ text, target, source }) {
  return `${source || "auto"}|${target}|${text}`;
}

export async function translateText({ text, target, source }) {
  if (!text || !target) return { translatedText: text || "", translated: false };

  const normalizedText = text.trim();
  if (!normalizedText) return { translatedText: text, translated: false };

  const cacheKey = buildCacheKey({ text: normalizedText, target, source });
  const cached = translationCache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  try {
    const res = await fetch(`${BACKEND_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: normalizedText, target, source }),
    });
    const data = await res.json();
    if (!res.ok || !data?.translatedText) {
      return { translatedText: text, translated: false, error: data?.error || "translate_failed" };
    }

    const value = {
      translatedText: data.translatedText,
      translated: true,
      detectedSource: data.detectedSource,
      target,
    };
    translationCache.set(cacheKey, value);
    return value;
  } catch {
    return { translatedText: text, translated: false, error: "network_error" };
  }
}
