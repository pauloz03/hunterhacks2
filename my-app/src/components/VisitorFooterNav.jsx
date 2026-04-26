import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { key: "home", path: "/home", aria: "Home" },
  { key: "map", path: "/map", aria: "Map" },
  { key: "ask", path: "/ask", aria: "Ask" },
  { key: "saved", path: "/saved", aria: "Saved" },
  { key: "profile", path: "/profile", aria: "Profile" },
];

export default function VisitorFooterNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="visitor-bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = location.pathname === item.path;
        return (
          <div key={item.key} className={`visitor-nav-item ${active ? "active" : ""}`}>
            <button
              type="button"
              className="visitor-nav-icon-button"
              aria-label={item.aria}
              onClick={() => navigate(item.path)}
            >
              {item.key === "home" && (
                <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5.5 9.8V20h13V9.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {item.key === "map" && (
                <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {item.key === "ask" && (
                <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-5 4v-13.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {item.key === "saved" && (
                <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {item.key === "profile" && (
                <svg className="visitor-nav-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <span className="visitor-nav-label">{t(`nav.${item.key}`)}</span>
          </div>
        );
      })}
    </nav>
  );
}
