import LandingPage from "./pages/LandingPage";
import AskScreen from "./screens/Ask";
import HomeScreen from "./screens/HomeScreen";
import MapScreen from "./screens/Map";
import ProfileScreen from "./screens/Profile";
import SavedScreen from "./screens/Saved";
import ProtectedScreen from "./components/ProtectedScreen";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

export default function App() {
  return (
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
  );
}
