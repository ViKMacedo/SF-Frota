"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { LatLngExpression, divIcon } from "leaflet";

import { vehicles } from "@/lib/mockdata";

const center: LatLngExpression = [-24.021347, -48.362951];

const carIcon = divIcon({
  html: "🚗",
  className: "text-2xl",
  iconSize: [24, 24],
});
export function TrackingMap() {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-800">
      <MapContainer center={center} zoom={15} className="h-[700px] w-full z-0">
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vehicles
          .filter(
            (
              vehicle,
            ): vehicle is typeof vehicle & {
              lat: number;
              lng: number;
            } => vehicle.lat !== undefined && vehicle.lng !== undefined,
          )
          .map((vehicle) => (
            <Marker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              icon={carIcon}
            >
              <Popup>
                <div className="space-y-1">
                  <h2 className="font-bold">{vehicle.model}</h2>
                  <p>Placa: {vehicle.plate}</p>
                  <p>Motorista: {vehicle.driver || "-"}</p>
                  <p>Velocidade: {vehicle.speed ?? 0} km/h</p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
