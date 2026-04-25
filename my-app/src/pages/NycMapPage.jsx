import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export default function NycMapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    const accessToken = import.meta.env.VITE_MAP_BOX_ACCESS_TOKEN;

    if (!accessToken) {
      setMapError("Missing Mapbox token. Check your .env file and restart dev server.");
      return;
    }

    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = accessToken;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-74.006, 40.7128], // NYC
        zoom: 12,
      });

      mapRef.current = map;

      map.on("load", () => {
        map.resize();
      });

      setMapError("");
    } catch (err) {
      console.error(err);
      setMapError("Could not initialize Mapbox map.");
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <main style={{ width: "100%", height: "100vh", position: "relative" }}>
      {mapError && (
        <p style={{ color: "red", position: "absolute", zIndex: 1 }}>
          {mapError}
        </p>
      )}

      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </main>
  );
}