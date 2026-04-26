import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { geolocationService } from "../services/geolocationService";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import VisitorFooterNav from "../components/VisitorFooterNav";

export default function MapScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userType = user?.persona_type ?? "neighbor";
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    const accessToken =
      import.meta.env.VITE_MAP_BOX_ACCESS_TOKEN ||
      import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      setMapError(t("map.errorMissingToken"));
      return;
    }

    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = accessToken;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-74.006, 40.7128],
        zoom: 12,
      });

      mapRef.current = map;

      map.on("load", async () => {
        setMapError("");
        map.resize();

        try {
          const { latitude, longitude } = await geolocationService.getCurrentPosition();
          const userCoords = [longitude, latitude];

          map.flyTo({
            center: userCoords,
            zoom: 14,
            essential: true,
          });

          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }

          const userLocationEl = document.createElement("div");
          userLocationEl.className = "user-location-dot";
          userLocationEl.innerHTML = '<span class="user-location-dot__pulse"></span><span class="user-location-dot__core"></span>';

          userMarkerRef.current = new mapboxgl.Marker({
            element: userLocationEl,
            anchor: "center",
          })
            .setLngLat(userCoords)
            .addTo(map);
        } catch (locationError) {
          const message =
            locationError instanceof Error ? locationError.message : t("map.errorLocation");
          setMapError(message);
        }
      });

      map.on("error", () => {
        setMapError(t("map.errorFailedLoad"));
      });
    } catch {
      setMapError(t("map.errorInit"));
    }

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

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
          <button type="button" className="map-filter active">{t("map.filterAll")}</button>
          <button type="button" className="map-filter">{t("map.filterHealth")}</button>
          <button type="button" className="map-filter">{t("map.filterLegal")}</button>
          <button type="button" className="map-filter">{t("map.filterFood")}</button>
          <button type="button" className="map-filter">{t("map.filterHousing")}</button>
        </div>
      </section>

      {mapError ? <div className="map-error">{mapError}</div> : null}

      <VisitorFooterNav />
    </main>
  );
}