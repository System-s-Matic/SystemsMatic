"use client";

import { useState, useCallback } from "react";
import { Map, Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface InteractiveMapProps {
  longitude?: number;
  latitude?: number;
  zoom?: number;
  height?: string;
}

export default function InteractiveMap({
  longitude = -61.623889,
  latitude = 16.204722,
  zoom = 15,
  height = "350px",
}: InteractiveMapProps) {
  const [viewState, setViewState] = useState({
    longitude,
    latitude,
    zoom,
  });

  const handleMapClick = useCallback(() => {
    // Ouvrir dans Google Maps quand on clique sur la carte
    window.open(
      "https://www.google.com/maps/dir/?api=1&destination=188+chemin+Malgré+Tout,+97170+Petit-Bourg,+Guadeloupe",
      "_blank"
    );
  }, []);

  return (
    <div style={{ width: "100%", height, borderRadius: "var(--radius-xl)" }}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "var(--radius-xl)",
        }}
        cursor="pointer"
      >
        {/* Contrôles de navigation (zoom, rotation) */}
        <NavigationControl position="top-right" showCompass={false} />

        {/* Marqueur personnalisé */}
        <Marker longitude={longitude} latitude={latitude} anchor="bottom">
          <div
            style={{
              width: "30px",
              height: "30px",
              cursor: "pointer",
            }}
            onClick={handleMapClick}
          >
            <svg
              viewBox="0 0 24 24"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="1"
              style={{
                width: "100%",
                height: "100%",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
              }}
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
        </Marker>
      </Map>
    </div>
  );
}
