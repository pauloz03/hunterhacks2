import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import AskScreen from "./screens/Ask";
import HomeScreen from "./screens/HomeScreen";
import CategoryScreen from "./screens/CategoryScreen";
import MapScreen from "./screens/Map";
import ProfileScreen from "./screens/Profile";
import SavedScreen from "./screens/Saved";
import ProtectedScreen from "./components/ProtectedScreen";
import LanguageLoadingOverlay from "./components/LanguageLoadingOverlay";
import { useAuth } from "./context/AuthContext";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ensureRuntimeLanguageBundle } from "./lib/runtimeLanguage";
import { useState } from "react";

export default function App() {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const [isLanguageBootstrapping, setIsLanguageBootstrapping] = useState(false);

  useEffect(() => {
    const preferredLanguage = (user?.language_code || "").split("-")[0];
    if (!preferredLanguage || preferredLanguage === "en") {
      setIsLanguageBootstrapping(false);
      return;
    }

    if (i18n.hasResourceBundle(preferredLanguage, "translation")) {
      i18n.changeLanguage(preferredLanguage);
      setIsLanguageBootstrapping(false);
      return;
    }

    let cancelled = false;
    setIsLanguageBootstrapping(true);
    i18n.changeLanguage("en");
    ensureRuntimeLanguageBundle(i18n, preferredLanguage)
      .then(() => {
        if (cancelled) return;
        if ((user?.language_code || "").split("-")[0] === preferredLanguage) {
          i18n.changeLanguage(preferredLanguage);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLanguageBootstrapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.language_code, i18n]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/home"
            element={(
              <ProtectedScreen>
                <HomeScreen />
              </ProtectedScreen>
            )}
          />
        <Route
          path="/category/:slug"
          element={(
            <ProtectedScreen>
              <CategoryScreen />
            </ProtectedScreen>
          )}
        />
          <Route
            path="/map"
            element={(
              <ProtectedScreen>
                <MapScreen />
              </ProtectedScreen>
            )}
          />
          <Route
            path="/ask"
            element={(
              <ProtectedScreen>
                <AskScreen />
              </ProtectedScreen>
            )}
          />
          <Route
            path="/saved"
            element={(
              <ProtectedScreen>
                <SavedScreen />
              </ProtectedScreen>
            )}
          />
          <Route
            path="/profile"
            element={(
              <ProtectedScreen>
                <ProfileScreen />
              </ProtectedScreen>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {isLanguageBootstrapping ? (
        <LanguageLoadingOverlay
          message={t("common.loadingLanguage", { defaultValue: "Translating your experience..." })}
        />
      ) : null}
    </>
  );
}
