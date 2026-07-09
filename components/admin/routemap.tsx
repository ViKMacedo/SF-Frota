"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";
import { divIcon, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Trip, RoutePoint } from "@/lib/db";

const TILE_LAYERS = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap",
  },
};

// Ajusta o mapa para caber toda a rota
function FitRoute({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    const bounds = new LatLngBounds(points);
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, points]);
  return null;
}

function pinIcon(color: string) {
  return divIcon({
    html: `
      <div style="
        width:14px;
        height:14px;
        background:${color};
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.5);
      "></div>
    `,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function MapThemeToggle({
  theme,
  onToggle,
}: {
  theme: "dark" | "light";
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={
        theme === "dark" ? "Mudar para mapa claro" : "Mudar para mapa escuro"
      }
      className="absolute top-2 right-2 z-[1000] flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-white shadow-lg backdrop-blur transition hover:bg-zinc-800"
    >
      {theme === "dark" ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}

type Props = { trip: Trip };

export function RouteMap({ trip }: Props) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const tile = TILE_LAYERS[theme];

  const pts: RoutePoint[] = trip.route ?? [];
  const hasRoute = pts.length >= 2;

  // Fallback: só ponto único (lat/lng da trip)
  const fallbackLat = trip.lat;
  const fallbackLng = trip.lng;

  if (!hasRoute && (!fallbackLat || !fallbackLng)) {
    return (
      <p className="text-zinc-500 text-sm">
        Nenhuma localização registrada para esta viagem.
      </p>
    );
  }

  const center: [number, number] = hasRoute
    ? [pts[0].lat, pts[0].lng]
    : [fallbackLat!, fallbackLng!];

  const polyline: [number, number][] = pts.map((p) => [p.lat, p.lng]);
  const start = pts[0];
  const end = pts[pts.length - 1];
  const maxSpeed = hasRoute ? Math.max(...pts.map((p) => p.speed ?? 0)) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative rounded-xl overflow-hidden border border-zinc-700"
        style={{ height: 280 }}
      >
        <MapThemeToggle
          theme={theme}
          onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        />
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer attribution={tile.attribution} url={tile.url} />

          {hasRoute && (
            <>
              <FitRoute points={polyline} />
              <Polyline
                positions={polyline}
                pathOptions={{ color: "#6366f1", weight: 4, opacity: 0.85 }}
              />
              <Marker
                position={[start.lat, start.lng]}
                icon={pinIcon("#22c55e")}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                  opacity={1}
                  permanent
                  className="route-point-tooltip"
                >
                  Início
                </Tooltip>
              </Marker>
              <Marker position={[end.lat, end.lng]} icon={pinIcon("#ef4444")}>
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                  opacity={1}
                  permanent
                  className="route-point-tooltip"
                >
                  Fim
                </Tooltip>
              </Marker>
            </>
          )}

          {!hasRoute && fallbackLat && fallbackLng && (
            <Marker
              position={[fallbackLat, fallbackLng]}
              icon={pinIcon("#6366f1")}
            />
          )}
        </MapContainer>
      </div>

      <style jsx global>{`
        .route-point-tooltip {
          background: #18181b !important;
          border: 1px solid #3f3f46 !important;
          color: #fff !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          border-radius: 0.375rem !important;
          padding: 2px 6px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
        }
        .route-point-tooltip::before {
          border-top-color: #3f3f46 !important;
        }
      `}</style>

      {hasRoute && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-zinc-500">Distância</p>
            <p className="font-semibold text-white">{trip.distance ?? 0} km</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-zinc-500">Vel. máxima</p>
            <p className="font-semibold text-white">{maxSpeed} km/h</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-zinc-500">Pontos GPS</p>
            <p className="font-semibold text-white">{pts.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
