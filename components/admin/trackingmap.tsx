"use client";

import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { LatLngExpression, divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import type { TrackingTrip } from "@/types/tracking";

type Props = {
  trips: TrackingTrip[];
  onSelectTrip: (trip: TrackingTrip) => void;
};
const center: LatLngExpression = [-24.021347, -48.362951];

function createVehicleIcon(
  driver: string,
  vehicle: string,
  status: string,
  speed: number,
) {
  return divIcon({
    html: `
      <div style="
        background:#18181b;
        border:1px solid #27272a;
        border-radius:20px;
        padding:12px 16px;
        min-width:160px;
        color:white;
        box-shadow:0 10px 30px rgba(0,0,0,0.45);
        backdrop-filter: blur(10px);
      ">
        <div style="
          display:flex;
          align-items:center;
          gap:8px;
          margin-bottom:10px;
        ">
          <div style="
            width:10px;
            height:10px;
            background:#22c55e;
            border-radius:999px;
            animation:pulse 1.5s infinite;
          "></div>
          <span style="
            font-size:12px;
            color:#22c55e;
            font-weight:700;
            letter-spacing:0.5px;
          ">
            ${status.toUpperCase()}
          </span>
        </div>
        <div style="
          display:flex;
          align-items:center;
          gap:10px;
          margin-bottom:10px;
        ">
          <div style="
            font-size:24px;
          ">
            🚗
          </div>
          <div>
            <div style="
              font-size:15px;
              font-weight:700;
              line-height:1.1;
            ">
              ${vehicle}
            </div>
            <div style="
              font-size:12px;
              color:#a1a1aa;
              margin-top:2px;
            ">
              ${driver}
            </div>
          </div>
        </div>
        <div style="
          font-size:13px;
          color:#d4d4d8;
          font-weight:600;
        ">
          ${speed} km/h
        </div>
      </div>
    `,
    className: "",
    iconSize: [180, 120],
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
export function TrackingMap({ trips, onSelectTrip }: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-800">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{
          height: "700px",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds trips={trips} />
        <MarkerClusterGroup chunkedLoading>
          {trips
            .filter(
              (trip): trip is TrackingTrip =>
                trip.lat !== undefined && trip.lng !== undefined,
            )
            .map((trip) => (
              <Marker
                key={trip.id}
                position={[trip.lat, trip.lng]}
                icon={createVehicleIcon(
                  trip.driverName,
                  trip.vehicleModel,
                  trip.statusLabel,
                  trip.speed,
                )}
                eventHandlers={{
                  click: () => onSelectTrip(trip),
                }}
              >
                <Popup>
                  <div className="space-y-2 min-w-[180px]">
                    <h2 className="font-bold text-base">{trip.vehicleModel}</h2>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-semibold">Motorista:</span>{" "}
                        {trip.driverName}
                      </p>
                      <p>
                        <span className="font-semibold">Status:</span>{" "}
                        {trip.statusLabel}
                      </p>
                      <p>
                        <span className="font-semibold">Velocidade:</span>{" "}
                        {trip.speed} km/h
                      </p>
                      <p>
                        <span className="font-semibold">KM:</span>{" "}
                        {trip.distance || 0} km
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      LIVE
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
