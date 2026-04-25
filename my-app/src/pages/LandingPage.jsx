import { useState } from "react";
import { useTranslation } from "react-i18next";
import AuthScreen from "../screens/AuthScreen";
import IntroLanding from "../screens/IntroLanding";
import LanguageSelect from "../screens/LanguageSelect";
import UserTypeSelect from "../screens/UserTypeSelect";

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
  { id: "newcomer", icon: "🌍", title: "Newcomer", subtitle: "From another country" },
  { id: "refugee", icon: "🕊️", title: "Refugee", subtitle: "Seeking safety" },
];

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0].nativeName);
  const [selectedUserType, setSelectedUserType] = useState("newcomer");
  const [authMode, setAuthMode] = useState("login");
  const [currentScreen, setCurrentScreen] = useState("intro");

  const localizedLanguages = languages.map((language) => ({
    ...language,
    englishName: t(`languageNames.${language.key}`),
  }));

  if (currentScreen === "intro") {
    return <IntroLanding languages={localizedLanguages} onGetStarted={() => setCurrentScreen("language")} />;
  }

  if (currentScreen === "auth") {
    return (
      <AuthScreen
        selectedLanguage={selectedLanguage}
        authMode={authMode}
        onSetAuthMode={setAuthMode}
        onBack={() => setCurrentScreen("language")}
        onSubmit={(event) => {
          event.preventDefault();
          if (authMode === "signup") {
            setCurrentScreen("userType");
          }
        }}
      />
    );
  }

  if (currentScreen === "userType") {
    return (
      <UserTypeSelect
        userTypes={userTypes}
        selectedUserType={selectedUserType}
        onSelectUserType={setSelectedUserType}
      />
    );
  }

  return (
    <LanguageSelect
      languages={localizedLanguages}
      selectedLanguage={selectedLanguage}
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
