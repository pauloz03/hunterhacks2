import { translateText } from "./translateClient";

const RUNTIME_TRANSLATION_NAMESPACES = [
  "intro",
  "landing",
  "languageNames",
  "auth",
  "userType",
  "common",
  "home",
  "map",
  "saved",
  "profile",
  "nav",
  "ask",
];

const translatedRuntimeLanguages = new Set();
const runtimeTranslationRequests = new Map();

function pickNamespaces(bundle) {
  const result = {};
  for (const namespace of RUNTIME_TRANSLATION_NAMESPACES) {
    if (bundle?.[namespace]) result[namespace] = bundle[namespace];
  }
  return result;
}

async function translateObjectLeaves(value, targetLanguage) {
  if (typeof value === "string") {
    const translated = await translateText({ text: value, target: targetLanguage, source: "en" });
    return translated.translatedText || value;
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map((entry) => translateObjectLeaves(entry, targetLanguage)));
  }
  if (value && typeof value === "object") {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, child]) => [key, await translateObjectLeaves(child, targetLanguage)])
    );
    return Object.fromEntries(entries);
  }
  return value;
}

export async function ensureRuntimeLanguageBundle(i18n, targetLanguage) {
  if (!targetLanguage || targetLanguage === "en") return;
  if (i18n.hasResourceBundle(targetLanguage, "translation")) return;
  if (translatedRuntimeLanguages.has(targetLanguage)) return;

  const existingRequest = runtimeTranslationRequests.get(targetLanguage);
  if (existingRequest) {
    await existingRequest;
    return;
  }

  const requestPromise = (async () => {
    const englishBundle = i18n.getResourceBundle("en", "translation");
    if (!englishBundle) return;

    const selectedNamespaces = pickNamespaces(englishBundle);
    const translatedBundle = await translateObjectLeaves(selectedNamespaces, targetLanguage);

    i18n.addResourceBundle(targetLanguage, "translation", translatedBundle, true, true);
    translatedRuntimeLanguages.add(targetLanguage);
  })();

  runtimeTranslationRequests.set(targetLanguage, requestPromise);
  try {
    await requestPromise;
  } finally {
    runtimeTranslationRequests.delete(targetLanguage);
  }
}
