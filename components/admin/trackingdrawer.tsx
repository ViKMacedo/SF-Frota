"use client";

import type { TrackingTrip } from "@/types/tracking";

type Props = {
  trip: TrackingTrip;
  onClose: () => void;
};

export function TrackingDrawer({ trip, onClose }: Props) {
  return (
    <div
      className="
        fixed
        top-0
        right-0
        h-screen
        w-[420px]
        bg-zinc-950/95
        backdrop-blur-xl
        border-l
        border-zinc-800
        z-[9999]
        p-8
        shadow-2xl
        overflow-y-auto
      "
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-semibold text-sm tracking-wide">
              LIVE
            </span>
          </div>
          <h2 className="text-2xl font-bold">{trip.vehicleModel}</h2>
          <p className="text-zinc-400 mt-1">{trip.driverName}</p>
        </div>
        <button
          onClick={onClose}
          className="
            w-10
            h-10
            rounded-xl
            bg-zinc-900
            border
            border-zinc-800
            hover:bg-zinc-800
            transition
            flex
            items-center
            justify-center
            text-zinc-400
            hover:text-white
          "
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="space-y-4 mb-8">
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-zinc-500 text-sm mb-1">Status operacional</p>
          <h3 className="text-lg font-semibold">{trip.statusLabel}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <p className="text-zinc-500 text-sm mb-1">Velocidade</p>
            <h3 className="text-2xl font-bold">{trip.speed} km/h</h3>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <p className="text-zinc-500 text-sm mb-1">KM rodado</p>
            <h3 className="text-2xl font-bold">{trip.distance || 0}</h3>
          </div>
        </div>
      </div>

      {/* Infos */}
      <div className="space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-zinc-500 text-sm mb-1">Início da utilização</p>
          <h3 className="font-semibold">
            {new Date(trip.startedAt).toLocaleString("pt-BR")}
          </h3>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-zinc-500 text-sm mb-1">ID da viagem</p>
          <h3 className="font-semibold">{trip.id}</h3>
        </div>
      </div>
    </div>
  );
}
