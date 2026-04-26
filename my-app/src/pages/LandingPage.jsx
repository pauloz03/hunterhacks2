import { useState } from "react";
import { useTranslation } from "react-i18next";
import AuthScreen from "../screens/AuthScreen";
import IntroLanding from "../screens/IntroLanding";
import LanguageSelect from "../screens/LanguageSelect";
import UserTypeSelect from "../screens/UserTypeSelect";
import ProtectedScreen from "../components/ProtectedScreen";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const languages = [
  { nativeName: "English", key: "english", code: "en" },
  { nativeName: "Español", key: "spanish", code: "es" },
  { nativeName: "中文", key: "chinese", code: "zh" },
  { nativeName: "العربية", key: "arabic", code: "ar" },
  { nativeName: "Français", key: "french", code: "fr" },
  { nativeName: "বাংলা", key: "bengali", code: "bn" },
  { nativeName: "Русский", key: "russian", code: "ru" },
  { nativeName: "Other", key: "other", code: "en" },
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
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0].nativeName);
  const [selectedUserType, setSelectedUserType] = useState("neighbor");
  const [authMode, setAuthMode] = useState("login");
  const [currentScreen, setCurrentScreen] = useState("intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const localizedLanguages = languages.map((language) => ({
    ...language,
    englishName: t(`languageNames.${language.key}`),
  }));
  const localizedUserTypes = userTypes.map((type) => ({
    ...type,
    title: t(`userType.options.${type.titleKey}`),
    subtitle: t(`userType.options.${type.subtitleKey}`),
  }));

  if (currentScreen === "intro") {
    return (
      <IntroLanding
        languages={localizedLanguages}
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
        onGetStarted={() => setCurrentScreen("language")}
      />
    );
  }

  if (currentScreen === "auth") {
    return (
      <AuthScreen
        selectedLanguage={selectedLanguage}
        authMode={authMode}
        onSetAuthMode={setAuthMode}
        onBack={() => setCurrentScreen("language")}
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
            const selectedLang = languages.find((l) => l.nativeName === selectedLanguage);
            try {
              const res = await fetch(`${BACKEND_URL}/users/profile`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user_id: user.id,
                  language_code: selectedLang?.code ?? "en",
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

  return (
    <LanguageSelect
      languages={localizedLanguages}
      selectedLanguage={selectedLanguage}
      titleLine1={t("landing.titleLine1")}
      titleLine2={t("landing.titleLine2")}
      subtitle={t("landing.subtitle")}
      continueLabel={t("landing.continue")}
      onSelectLanguage={(nativeName) => {
        const selected = languages.find((language) => language.nativeName === nativeName);
        setSelectedLanguage(nativeName);
        if (selected) {
          i18n.changeLanguage(selected.code);
        }
      }}
      onContinue={() => setCurrentScreen("auth")}
    />
  );
}
