"use client";

import {
  MapContainer,
  Marker,
  Polyline,
  Tooltip,
  TileLayer,
  useMap,
} from "react-leaflet";
import { LatLngExpression, divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import type { TrackingTrip } from "@/types/tracking";

type Props = {
  trips: TrackingTrip[];
  selectedTrip: TrackingTrip | null;
  onSelectTrip: (trip: TrackingTrip) => void;
};
const center: LatLngExpression = [-24.021347, -48.362951];

const STATUS_COLOR: Record<string, string> = {
  Parado: "#eab308",
  Finalizando: "#ef4444",
};
const DEFAULT_COLOR = "#22c55e"; // em movimento

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

function createVehicleIcon(status: string) {
  const color = STATUS_COLOR[status] ?? DEFAULT_COLOR;

  return divIcon({
    html: `
      <div style="position:relative;width:40px;height:40px;">
        <div style="
          width:40px;
          height:40px;
          border-radius:50%;
          background:#18181b;
          border:3px solid ${color};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:18px;
          box-shadow:0 4px 12px rgba(0,0,0,0.45);
        ">🚗</div>
        <div style="
          position:absolute;
          top:-2px;
          right:-2px;
          width:12px;
          height:12px;
          border-radius:999px;
          background:${color};
          border:2px solid #18181b;
        "></div>
      </div>
    `,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
    tooltipAnchor: [0, -22],
  });
}
function FitBounds({ trips }: { trips: TrackingTrip[] }) {
  const map = useMap();

  useEffect(() => {
    if (trips.length === 0) {
      return;
    }

    const bounds = trips
      .filter(
        (trip): trip is TrackingTrip =>
          trip.lat !== undefined && trip.lng !== undefined,
      )
      .map((trip) => [trip.lat, trip.lng] as [number, number]);

    if (bounds.length > 0) {
      map.fitBounds(bounds, {
        padding: [50, 50],
      });
    }
  }, [trips, map]);

  return null;
}
function FocusVehicle({ trip }: { trip: TrackingTrip | null }) {
  const map = useMap();

  useEffect(() => {
    if (!trip || trip.lat === undefined || trip.lng === undefined) {
      return;
    }

    map.flyTo([trip.lat, trip.lng], 16, {
      duration: 1.5,
    });
  }, [trip, map]);
  return null;
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
      className="absolute top-3 right-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-white shadow-lg backdrop-blur transition hover:bg-zinc-800"
    >
      {theme === "dark" ? (
        <svg
          width="18"
          height="18"
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
          width="18"
          height="18"
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

export function TrackingMap({ trips, selectedTrip, onSelectTrip }: Props) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const tile = TILE_LAYERS[theme];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800">
      <MapThemeToggle
        theme={theme}
        onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{
          height: "700px",
          width: "100%",
        }}
      >
        <TileLayer attribution={tile.attribution} url={tile.url} />
        <FitBounds trips={trips} />
        <FocusVehicle trip={selectedTrip} />
        <>
          {trips
            .filter(
              (trip): trip is TrackingTrip =>
                trip.lat !== undefined && trip.lng !== undefined,
            )
            .map((trip) => {
              const routePoints: [number, number][] = (trip.route ?? []).map(
                (p) => [p.lat, p.lng],
              );
              const polylineColor =
                trip.statusLabel === "Parado"
                  ? "#eab308"
                  : trip.statusLabel === "Finalizando"
                    ? "#ef4444"
                    : "#22c55e";

              return (
                <span key={trip.id}>
                  {routePoints.length > 1 && (
                    <Polyline
                      positions={routePoints}
                      pathOptions={{
                        color: polylineColor,
                        weight: 3,
                        opacity: 0.7,
                      }}
                    />
                  )}
                  <Marker
                    position={[trip.lat!, trip.lng!]}
                    icon={createVehicleIcon(trip.statusLabel)}
                    eventHandlers={{ click: () => onSelectTrip(trip) }}
                  >
                    <Tooltip
                      direction="top"
                      offset={[0, -22]}
                      opacity={1}
                      permanent
                      className="vehicle-label-tooltip"
                    >
                      <div className="text-xs leading-tight text-center">
                        <div className="font-bold">{trip.vehicleModel}</div>
                        <div className="text-zinc-400">{trip.driverName}</div>
                      </div>
                    </Tooltip>
                  </Marker>
                </span>
              );
            })}
        </>
      </MapContainer>
      <style jsx global>{`
        .vehicle-label-tooltip {
          background: #18181b !important;
          border: 1px solid #3f3f46 !important;
          color: #fff !important;
          border-radius: 0.5rem !important;
          padding: 4px 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }
        .vehicle-label-tooltip::before {
          border-top-color: #3f3f46 !important;
        }
      `}</style>
    </div>
  );
}
