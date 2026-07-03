"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
} from "react-leaflet";
import { divIcon, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Trip, RoutePoint } from "@/lib/db";

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

type Props = { trip: Trip };

export function RouteMap({ trip }: Props) {
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
        className="rounded-xl overflow-hidden border border-zinc-700"
        style={{ height: 280 }}
      >
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

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
              />
              <Marker position={[end.lat, end.lng]} icon={pinIcon("#ef4444")} />
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
