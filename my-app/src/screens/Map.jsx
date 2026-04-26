import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { geolocationService } from "../services/geolocationService";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import VisitorFooterNav from "../components/VisitorFooterNav";
import MapSearchBar from "../components/MapSearchBar";

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
  const searchPopupRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mapError, setMapError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedResourceIds, setSavedResourceIds] = useState([]);

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
  const toggleSaveResource = useCallback(async (resourceId, shouldSave) => {
    if (!user?.id) {
      return { ok: false, error: "You need to be signed in to save resources." };
    }

    try {
      const res = await fetch(`${BACKEND_URL}/users/saved`, {
        method: shouldSave ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          resource_id: resourceId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data?.error || "Failed to update saved resource." };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error while updating saved resource." };
    }
  }, [user?.id]);

  const loadSavedResources = useCallback(async () => {
    if (!user?.id) {
      setSavedResourceIds([]);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/users/saved?user_id=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (!res.ok) return;
      const ids = (data.resources || [])
        .map((r) => String(r.id))
        .filter((id) => id !== null && id !== undefined);
      setSavedResourceIds(ids);
    } catch {
      // no-op
    }
  }, [user?.id]);

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
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load map resources.");
      }
      const resources = data.resources ?? [];

      resources.forEach(r => {
        const resourceId = String(r.id);
        const el = createPinEl(r.category);
        const popupEl = document.createElement("div");
        popupEl.style.cssText = "font-family:sans-serif;padding:4px 2px;min-width:220px;";

        const title = document.createElement("p");
        title.style.cssText = "margin:0 0 4px;font-weight:700;font-size:13px;color:#111;";
        title.textContent = r.name || "Resource";
        popupEl.appendChild(title);

        if (r.address) {
          const address = document.createElement("p");
          address.style.cssText = "margin:0 0 4px;font-size:12px;color:#555;";
          address.textContent = r.address;
          popupEl.appendChild(address);
        }

        if (r.phone) {
          const phone = document.createElement("p");
          phone.style.cssText = "margin:0 0 6px;font-size:12px;color:#555;";
          phone.textContent = `📞 ${r.phone}`;
          popupEl.appendChild(phone);
        }

        if (r.is_free) {
          const freeTag = document.createElement("span");
          freeTag.style.cssText = "font-size:11px;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:99px;font-weight:600;display:inline-block;margin-bottom:6px;";
          freeTag.textContent = "Free";
          popupEl.appendChild(freeTag);
        }

        const actions = document.createElement("div");
        actions.style.cssText = "display:flex;align-items:center;gap:8px;margin-top:6px;";

        const heartButton = document.createElement("button");
        heartButton.type = "button";
        heartButton.style.cssText = "border:0;background:#fff1f2;color:#be123c;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer;";
        const isSavedInitially = savedResourceIds.includes(resourceId);
        heartButton.textContent = isSavedInitially ? "♥ Saved" : "♡ Save";

        heartButton.addEventListener("click", async () => {
          const currentlySaved = savedResourceIds.includes(resourceId);
          const result = await toggleSaveResource(r.id, !currentlySaved);
          if (!result.ok) {
            setMapError(result.error || "Failed to update saved resource.");
            return;
          }
          setMapError("");

          setSavedResourceIds((prev) => {
            const exists = prev.includes(resourceId);
            const next = exists ? prev.filter((id) => id !== resourceId) : [...prev, resourceId];
            heartButton.textContent = exists ? "♡ Save" : "♥ Saved";
            return next;
          });
        });
        actions.appendChild(heartButton);

        if (r.website) {
          const link = document.createElement("a");
          link.href = r.website;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.style.cssText = "font-size:11px;color:#2563eb;text-decoration:none;";
          link.textContent = "Visit website →";
          actions.appendChild(link);
        }

        popupEl.appendChild(actions);

        const popup = new mapboxgl.Popup({ offset: 28, closeButton: false, maxWidth: "280px" })
          .setDOMContent(popupEl);

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([parseFloat(r.longitude), parseFloat(r.latitude)])
          .setPopup(popup)
          .addTo(mapRef.current);

        resourceMarkersRef.current.push(marker);
      });
    } catch (error) {
      setMapError(
        error instanceof Error
          ? error.message
          : "Failed to load resources. Make sure backend is running.",
      );
    }

    setLoading(false);
  }, [savedResourceIds, toggleSaveResource]);

  useEffect(() => {
    if (mapReady) loadResources(activeFilter);
  }, [mapReady, activeFilter, loadResources]);

  useEffect(() => {
    loadSavedResources();
  }, [loadSavedResources]);

  function handleSearchSelect(resource) {
    const map = mapRef.current;
    if (!map) return;

    const lng = parseFloat(resource.longitude);
    const lat = parseFloat(resource.latitude);
    if (isNaN(lng) || isNaN(lat)) return;

    if (searchPopupRef.current) {
      searchPopupRef.current.remove();
      searchPopupRef.current = null;
    }

    map.flyTo({ center: [lng, lat], zoom: 16, essential: true });

    searchPopupRef.current = new mapboxgl.Popup({ offset: 28, closeButton: true, maxWidth: "260px" })
      .setLngLat([lng, lat])
      .setHTML(`
        <div style="font-family:sans-serif;padding:4px 2px">
          <p style="margin:0 0 4px;font-weight:700;font-size:13px;color:#111">${resource.name}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#555">${resource.address || ""}</p>
          ${resource.phone ? `<p style="margin:0;font-size:12px;color:#555">📞 ${resource.phone}</p>` : ""}
          ${resource.is_free ? `<span style="font-size:11px;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:99px;font-weight:600">Free</span>` : ""}
          ${resource.website ? `<br/><a href="${resource.website}" target="_blank" style="font-size:11px;color:#2563eb;margin-top:4px;display:inline-block">Visit website →</a>` : ""}
        </div>
      `)
      .addTo(map);
  }

  return (
    <main className={`visitor-page visitor-page--${userType} map-screen`}>
      <div ref={mapContainerRef} className="map-container" />

      <section className="map-content map-overlay">
        <h1 className="map-title">{t("map.title")}</h1>

        <MapSearchBar onSelectResult={handleSearchSelect} />

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
