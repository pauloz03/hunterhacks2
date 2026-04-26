import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { geolocationService } from "../services/geolocationService";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import VisitorFooterNav from "../components/VisitorFooterNav";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const FILTERS = [
  { label: "All",          value: "all" },
  { label: "Food",         value: "food" },
  { label: "Health",       value: "health" },
  { label: "Legal",        value: "legal-rights" },
  { label: "Housing",      value: "housing" },
  { label: "Community",    value: "community" },
];

const CATEGORY_COLOR = {
  food:          "#F97316",
  health:        "#EF4444",
  "legal-rights":"#8B5CF6",
  housing:       "#3B82F6",
  community:     "#10B981",
  transit:       "#06B6D4",
  work:          "#EAB308",
  banking:       "#6366F1",
  school:        "#EC4899",
  emergency:     "#DC2626",
};

function pinColor(category) {
  return CATEGORY_COLOR[category] ?? "#6B7280";
}

function createPinEl(category) {
  const color = pinColor(category);
  const el = document.createElement("div");
  el.style.cssText = `
    width:28px;height:36px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
  `;
  el.innerHTML = `
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.268 21.732 0 14 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>`;
  return el;
}

export default function MapScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userType = user?.persona_type ?? "neighbor";

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const resourceMarkersRef = useRef([]);

  const [mapReady, setMapReady] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mapError, setMapError] = useState("");
  const [loading, setLoading] = useState(false);

  // Init map once
  useEffect(() => {
    const accessToken =
      import.meta.env.VITE_MAP_BOX_ACCESS_TOKEN ||
      import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) { setMapError(t("map.errorMissingToken")); return; }
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-73.89, 40.75],
      zoom: 12,
    });

    mapRef.current = map;

    map.on("load", async () => {
      setMapError("");
      map.resize();
      setMapReady(true);

      try {
        const { latitude, longitude } = await geolocationService.getCurrentPosition();
        map.flyTo({ center: [longitude, latitude], zoom: 14, essential: true });

        const el = document.createElement("div");
        el.className = "user-location-dot";
        el.innerHTML = '<span class="user-location-dot__pulse"></span><span class="user-location-dot__core"></span>';

        userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([longitude, latitude])
          .addTo(map);
      } catch {
        // location denied — stay at default center
      }
    });

    map.on("error", () => setMapError(t("map.errorFailedLoad")));

    return () => {
      resourceMarkersRef.current.forEach(m => m.remove());
      resourceMarkersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch + pin resources whenever filter changes (and map is ready)
  const loadResources = useCallback(async (category) => {
    if (!mapRef.current) return;

    setLoading(true);

    // Clear old pins
    resourceMarkersRef.current.forEach(m => m.remove());
    resourceMarkersRef.current = [];

    try {
      const url = category === "all"
        ? `${BACKEND_URL}/resources`
        : `${BACKEND_URL}/resources?category=${category}`;

      const res = await fetch(url);
      const data = await res.json();
      const resources = data.resources ?? [];

      resources.forEach(r => {
        const el = createPinEl(r.category);

        const popup = new mapboxgl.Popup({ offset: 28, closeButton: false, maxWidth: "260px" })
          .setHTML(`
            <div style="font-family:sans-serif;padding:4px 2px">
              <p style="margin:0 0 4px;font-weight:700;font-size:13px;color:#111">${r.name}</p>
              <p style="margin:0 0 4px;font-size:12px;color:#555">${r.address || ""}</p>
              ${r.phone ? `<p style="margin:0 0 4px;font-size:12px;color:#555">📞 ${r.phone}</p>` : ""}
              ${r.is_free ? `<span style="font-size:11px;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:99px;font-weight:600">Free</span>` : ""}
              ${r.website ? `<br/><a href="${r.website}" target="_blank" style="font-size:11px;color:#2563eb;margin-top:4px;display:inline-block">Visit website →</a>` : ""}
            </div>
          `);

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([parseFloat(r.longitude), parseFloat(r.latitude)])
          .setPopup(popup)
          .addTo(mapRef.current);

        resourceMarkersRef.current.push(marker);
      });
    } catch {
      // silently fail — map still usable
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (mapReady) loadResources(activeFilter);
  }, [mapReady, activeFilter, loadResources]);

  return (
    <main className={`visitor-page visitor-page--${userType} map-screen`}>
      <div ref={mapContainerRef} className="map-container" />

      <section className="map-content map-overlay">
        <h1 className="map-title">{t("map.title")}</h1>

        <div className="map-search">
          <span className="map-search-icon">⌕</span>
          <span className="map-search-placeholder">{t("map.searchPlaceholder")}</span>
        </div>

        <div className="map-filters">
          {FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              className={`map-filter${activeFilter === f.value ? " active" : ""}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <p style={{ color: "var(--persona-accent)", fontSize: 13, margin: "8px 0 0" }}>
            Loading…
          </p>
        )}
      </section>

      {mapError && <div className="map-error">{mapError}</div>}

      <VisitorFooterNav />
    </main>
  );
}
