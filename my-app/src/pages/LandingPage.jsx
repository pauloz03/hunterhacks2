import { useState } from "react";
import { useTranslation } from "react-i18next";
import AuthScreen from "../screens/AuthScreen";
import IntroLanding from "../screens/IntroLanding";
import UserTypeSelect from "../screens/UserTypeSelect";
import ProtectedScreen from "../components/ProtectedScreen";
import LanguageSearchModal from "../components/LanguageSearchModal";
import LanguageLoadingOverlay from "../components/LanguageLoadingOverlay";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { OTHER_LANGUAGE_CODE, languageCatalog } from "../data/languageCatalog";
import { ensureRuntimeLanguageBundle } from "../lib/runtimeLanguage";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const languages = [
  { nativeName: "English", key: "english", code: "en" },
  { nativeName: "Español", key: "spanish", code: "es" },
  { nativeName: "中文", key: "chinese", code: "zh" },
  { nativeName: "العربية", key: "arabic", code: "ar" },
  { nativeName: "Français", key: "french", code: "fr" },
  { nativeName: "বাংলা", key: "bengali", code: "bn" },
  { nativeName: "Русский", key: "russian", code: "ru" },
];

const userTypes = [
  { id: "visitor", icon: "✈️", titleKey: "visitor", subtitleKey: "visitorSubtitle" },
  { id: "neighbor", icon: "🏘️", titleKey: "neighbor", subtitleKey: "neighborSubtitle" },
  { id: "familiar", icon: "🧭", titleKey: "familiar", subtitleKey: "familiarSubtitle" },
  { id: "refugee", icon: "🕊️", titleKey: "refugee", subtitleKey: "refugeeSubtitle" },
];

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("en");
  const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState("neighbor");
  const [authMode, setAuthMode] = useState("login");
  const [currentScreen, setCurrentScreen] = useState("intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLanguageSwitching, setIsLanguageSwitching] = useState(false);

  const localizedLanguages = languages.map((language) => ({
    ...language,
    label: t(`languageNames.${language.key}`),
  }));
  const introLanguages = [
    ...localizedLanguages,
    { code: OTHER_LANGUAGE_CODE, nativeName: "Other", key: "other", label: t("languageNames.other") },
  ];

  const applyLanguagePreference = async (code) => {
    if (!code || code === OTHER_LANGUAGE_CODE) return;
    setSelectedLanguageCode(code);
    if (i18n.hasResourceBundle(code, "translation")) {
      i18n.changeLanguage(code);
      return;
    }
    setIsLanguageSwitching(true);
    i18n.changeLanguage("en");
    await ensureRuntimeLanguageBundle(i18n, code);
    i18n.changeLanguage(code);
    setIsLanguageSwitching(false);
  };
  const applyLanguagePreferenceSafe = (code) => {
    applyLanguagePreference(code).catch(() => {
      // keep app usable even if translation fetch fails
    }).finally(() => {
      setIsLanguageSwitching(false);
    });
  };
  const localizedUserTypes = userTypes.map((type) => ({
    ...type,
    title: t(`userType.options.${type.titleKey}`),
    subtitle: t(`userType.options.${type.subtitleKey}`),
  }));
  const selectedLanguageMetadata = languageCatalog.find((language) => language.code === selectedLanguageCode);
  const selectedLanguageLabel =
    t(`languageNames.${languages.find((language) => language.code === selectedLanguageCode)?.key || ""}`, {
      defaultValue: selectedLanguageMetadata?.englishName || "English",
    }) || selectedLanguageMetadata?.englishName || "English";

  if (currentScreen === "intro") {
    return (
      <>
        <IntroLanding
          languages={introLanguages}
          selectedLanguageCode={selectedLanguageCode}
          copy={{
            brandTitle: t("intro.brandTitle"),
            guidePrefix: t("intro.guidePrefix"),
            cityPhrase: t("intro.cityPhrase"),
            languagePhrase: t("intro.languagePhrase"),
            getStarted: t("intro.getStarted"),
            floatingTransit: t("intro.floating.transit"),
            floatingHealth: t("intro.floating.health"),
            floatingLegal: t("intro.floating.legal"),
            floatingFood: t("intro.floating.food"),
            floatingHousing: t("intro.floating.housing"),
            floatingEducation: t("intro.floating.education"),
            supportedLanguagesAria: t("intro.supportedLanguagesAria"),
          }}
          onSelectLanguage={(code) => {
            if (code === OTHER_LANGUAGE_CODE) {
              setIsLanguagePickerOpen(true);
              return;
            }
            applyLanguagePreferenceSafe(code);
          }}
          languagePickerModal={
            <LanguageSearchModal
              isOpen={isLanguagePickerOpen}
              selectedLanguageCode={selectedLanguageCode}
              onClose={() => setIsLanguagePickerOpen(false)}
              onSelectLanguage={(code) => {
                applyLanguagePreferenceSafe(code);
                setIsLanguagePickerOpen(false);
              }}
            />
          }
          onGetStarted={() => setCurrentScreen("auth")}
        />
        {isLanguageSwitching ? (
          <LanguageLoadingOverlay
            message={t("common.loadingLanguage", { defaultValue: "Translating your experience..." })}
          />
        ) : null}
      </>
    );
  }

  if (currentScreen === "auth") {
    return (
      <AuthScreen
        selectedLanguage={selectedLanguageLabel}
        authMode={authMode}
        onSetAuthMode={setAuthMode}
        onBack={() => setCurrentScreen("intro")}
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        isSubmitting={isSubmitting}
        message={authMessage}
        onSubmit={async (event) => {
          event.preventDefault();
          setAuthMessage("");

          if (!email.trim() || !password.trim()) {
            setAuthMessage(t("auth.requiredEmailPassword"));
            return;
          }

          setIsSubmitting(true);

          try {
            const endpoint = authMode === "login" ? "/auth/login" : "/auth/signup";
            const res = await fetch(`${BACKEND_URL}${endpoint}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: email.trim(), password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || t("auth.failed"));
            if (data.user) login(data.user);
            if (authMode === "login" && data.user) {
              navigate("/home");
            } else if (authMode === "signup" && data.user) {
              setCurrentScreen("userType");
            } else {
              setAuthMessage(data.message);
            }
          } catch (error) {
              setAuthMessage(error?.message || t("auth.failed"));
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    );
  }

  if (currentScreen === "userType") {
    return (
      <ProtectedScreen>
        <UserTypeSelect
          userTypes={localizedUserTypes}
          selectedUserType={selectedUserType}
          onSelectUserType={setSelectedUserType}
          isSubmitting={isSubmitting}
          onContinue={async () => {
            setIsSubmitting(true);
            try {
              const res = await fetch(`${BACKEND_URL}/users/profile`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user_id: user.id,
                  language_code: selectedLanguageCode || "en",
                  persona_type: selectedUserType,
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || t("userType.saveFailed"));
              login({ ...user, persona_type: selectedUserType });
              navigate("/home");
            } catch (err) {
              console.error(err);
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      </ProtectedScreen>
    );
  }
  return null;
}
