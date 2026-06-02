"use client";

import { Trip } from "@/lib/db";

type Props = {
  trip: Trip | null;
  open: boolean;
  onClose: () => void;
};
export function TripDrawer({ trip, open, onClose }: Props) {
  if (!trip) return null;
  return (
    <>
      <div
        onClick={onClose}
        className={`
          fixed inset-0 bg-black/60 z-40 transition-opacity
          ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      />
      <div
        className={`
          fixed top-0 right-0 h-screen w-[500px]
          bg-zinc-950 border-l border-zinc-800
          z-50 transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {trip.vehicleModel}
            </h2>
            <p className="text-zinc-500 text-sm">
              {trip.vehiclePlate} • Utilização #{trip.id}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-88px)]">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <p className="text-zinc-500 text-xs">KM Rodado</p>
              <p className="text-xl font-bold text-green-400">
                {trip.distance ?? 0}
              </p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <p className="text-zinc-500 text-xs">Duração</p>
              <p className="text-xl font-bold">{trip.duration ?? "-"}</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <p className="text-zinc-500 text-xs">Status</p>
              <p
                className={`font-bold ${
                  trip.status === "Em andamento"
                    ? "text-green-400"
                    : "text-indigo-400"
                }`}
              >
                {trip.status}
              </p>
            </div>
          </div>
          {/* Status */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <p className="text-zinc-500 text-sm mb-2">Status</p>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                trip.status === "Em andamento"
                  ? "bg-green-500/10 text-green-400"
                  : "bg-indigo-500/10 text-indigo-400"
              }`}
            >
              {trip.status}
            </span>
          </div>

          {/* Motorista */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <p className="text-zinc-500 text-sm mb-2">Motorista</p>
            <h3 className="text-lg font-semibold text-white">
              {trip.driverName}
            </h3>
          </div>

          {/* Veículo */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <p className="text-zinc-500 text-sm mb-2">Veículo</p>
            <h3 className="text-lg font-semibold text-white">
              {trip.vehicleModel}
            </h3>
            <p className="text-zinc-400">{trip.vehiclePlate}</p>
          </div>

          {/* Quilometragem */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <h3 className="font-semibold mb-4 text-white">Quilometragem</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-zinc-500 text-sm">Inicial</p>
                <p className="font-semibold">{trip.startKm}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Final</p>
                <p className="font-semibold">{trip.endKm ?? "-"}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Rodado</p>
                <p className="font-semibold text-green-400">
                  {trip.distance ?? 0} km
                </p>
              </div>
            </div>
          </div>

          {/* Tempo */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <h3 className="font-semibold mb-4 text-white">Tempo</h3>
            <div className="space-y-3">
              <div>
                <p className="text-zinc-500 text-sm">Início</p>
                <p>{new Date(trip.startedAt).toLocaleString("pt-BR")}</p>
              </div>

              <div>
                <p className="text-zinc-500 text-sm">Fim</p>
                <p>
                  {trip.endedAt
                    ? new Date(trip.endedAt).toLocaleString("pt-BR")
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-zinc-500 text-sm">Duração</p>
                <p className="font-semibold">{trip.duration ?? "-"}</p>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <h3 className="font-semibold mb-4 text-white">
              Localização registrada
            </h3>

            <div className="space-y-2 text-sm">
              <p>
                <span className="text-zinc-500">Latitude:</span> {trip.lat}
              </p>
              <p>
                <span className="text-zinc-500">Longitude:</span> {trip.lng}
              </p>
            </div>
          </div>

          {/* Sincronização */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <p className="text-zinc-500 text-sm mb-2">Sincronização</p>
            <p className={trip.synced ? "text-green-400" : "text-yellow-400"}>
              {trip.synced ? "Sincronizado" : "Pendente"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
