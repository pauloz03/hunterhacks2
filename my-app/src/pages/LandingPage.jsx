import { useState } from "react";
import { useTranslation } from "react-i18next";
import AuthScreen from "../screens/AuthScreen";
import AskScreen from "../screens/Ask";
import HomeScreen from "../screens/HomeScreen";
import IntroLanding from "../screens/IntroLanding";
import LanguageSelect from "../screens/LanguageSelect";
import MapScreen from "../screens/Map";
import ProfileScreen from "../screens/Profile";
import SavedScreen from "../screens/Saved";
import UserTypeSelect from "../screens/UserTypeSelect";
import ProtectedScreen from "../components/ProtectedScreen";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const languages = [
  { nativeName: "English", key: "english", code: "en" },
  { nativeName: "Español", key: "spanish", code: "es" },
  { nativeName: "中文", key: "chinese", code: "en" },
  { nativeName: "العربية", key: "arabic", code: "en" },
  { nativeName: "Français", key: "french", code: "en" },
  { nativeName: "বাংলা", key: "bengali", code: "en" },
  { nativeName: "Русский", key: "russian", code: "en" },
  { nativeName: "Other", key: "other", code: "en" },
];

const userTypes = [
  { id: "visitor", icon: "✈️", title: "Visitor", subtitle: "1-7 days" },
  { id: "neighbor", icon: "🏘️", title: "New Neighbor", subtitle: "Moved within NYC" },
  { id: "familiar", icon: "🧭", title: "Already Familiar", subtitle: "Know the neighborhood" },
  { id: "refugee", icon: "🕊️", title: "Refugee", subtitle: "Seeking safety" },
];

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const { user, login } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0].nativeName);
  const [selectedUserType, setSelectedUserType] = useState("neighbor");
  const [authMode, setAuthMode] = useState("login");
  const [currentScreen, setCurrentScreen] = useState(() => user ? "home" : "intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const localizedLanguages = languages.map((language) => ({
    ...language,
    englishName: t(`languageNames.${language.key}`),
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
            setAuthMessage("Email and password are required.");
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
            if (!res.ok) throw new Error(data.error || "Authentication failed.");
            if (data.user) login(data.user);
            if (authMode === "login" && data.user) {
              setCurrentScreen("home");
            } else if (authMode === "signup" && data.user) {
              setCurrentScreen("userType");
            } else {
              setAuthMessage(data.message);
            }
          } catch (error) {
            setAuthMessage(error?.message || "Authentication failed.");
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    );
  }

  if (currentScreen === "userType") {
    return (
      <ProtectedScreen onUnauthenticated={() => setCurrentScreen("auth")}>
        <UserTypeSelect
          userTypes={userTypes}
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
              if (!res.ok) throw new Error(data.error || "Failed to save profile.");
              login({ ...user, persona_type: selectedUserType });
              setCurrentScreen("home");
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

  if (currentScreen === "home") {
    return (
      <ProtectedScreen onUnauthenticated={() => setCurrentScreen("auth")}>
        <HomeScreen onNavigate={setCurrentScreen} />
      </ProtectedScreen>
    );
  }

  if (currentScreen === "map") {
    return (
      <ProtectedScreen onUnauthenticated={() => setCurrentScreen("auth")}>
        <MapScreen userType={selectedUserType} onNavigate={setCurrentScreen} />
      </ProtectedScreen>
    );
  }

  if (currentScreen === "ask") {
    return (
      <ProtectedScreen onUnauthenticated={() => setCurrentScreen("auth")}>
        <AskScreen userType={selectedUserType} onNavigate={setCurrentScreen} />
      </ProtectedScreen>
    );
  }

  if (currentScreen === "profile") {
    return (
      <ProtectedScreen onUnauthenticated={() => setCurrentScreen("auth")}>
        <ProfileScreen userType={selectedUserType} onNavigate={setCurrentScreen} />
      </ProtectedScreen>
    );
  }

  if (currentScreen === "saved") {
    return (
      <ProtectedScreen onUnauthenticated={() => setCurrentScreen("auth")}>
        <SavedScreen userType={selectedUserType} onNavigate={setCurrentScreen} />
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
