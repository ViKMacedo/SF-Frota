"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  MAINTENANCE_KEYS,
  MAINTENANCE_LABELS,
  type Refuel,
  Trip,
  type Vehicle,
} from "@/lib/db";
import { getRefuelsByVehicle } from "@/services/refuelService";
import { getVehicleById } from "@/services/vehicleService";
import { Fuel, Wrench } from "lucide-react";

const RouteMap = dynamic(
  () => import("@/components/admin/routemap").then((m) => m.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] rounded-xl bg-zinc-800 animate-pulse" />
    ),
  },
);

type Props = {
  trip: Trip | null;
  open: boolean;
  onClose: () => void;
};
export function TripDrawer({ trip, open, onClose }: Props) {
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;
    Promise.all([
      getRefuelsByVehicle(trip.vehicleId),
      getVehicleById(trip.vehicleId),
    ]).then(([allRefuels, v]) => {
      if (cancelled) return;
      setRefuels(allRefuels.filter((r) => r.tripId === trip.id));
      setVehicle(v ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [trip]);

  if (!trip) return null;

  // Manutenção ainda não é vinculada a uma viagem específica no schema —
  // aproximamos vendo se o KM registrado do item caiu dentro da faixa de
  // KM percorrida nessa viagem (mesma lógica usada no perfil do veículo).
  const kmFim = trip.endKm ?? vehicle?.km ?? trip.startKm;
  const maintenanceDone = vehicle?.manutencao
    ? MAINTENANCE_KEYS.filter((key) => {
        const item = vehicle.manutencao?.[key];
        if (!item?.ultimoKm) return false;
        return item.ultimoKm >= trip.startKm && item.ultimoKm <= kmFim;
      })
    : [];

  return (
    <>
      <div
        onClick={onClose}
        className={`
        fixed inset-0
        bg-black/60
        backdrop-blur-sm
        z-40
        transition-opacity
        ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      />
      <div
        onClick={(e) => e.stopPropagation()}
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

          {/* Abastecimento */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
              <Fuel className="w-4 h-4 text-blue-400" />
              Abastecimento
            </h3>
            {refuels.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nenhum abastecimento registrado nessa viagem.
              </p>
            ) : (
              <div className="space-y-3">
                {refuels.map((refuel) => (
                  <div
                    key={refuel.id}
                    className="flex items-center justify-between gap-3 bg-blue-500/5 rounded-xl px-3 py-2.5"
                  >
                    <div>
                      <p className="font-semibold text-blue-300">
                        {refuel.litros} litros
                      </p>
                      <p className="text-xs text-zinc-500">
                        no KM {refuel.kmAtual.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {new Date(refuel.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manutenção */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-yellow-400" />
              Manutenção
            </h3>
            {maintenanceDone.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nenhuma manutenção registrada por volta dessa viagem.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {maintenanceDone.map((key) => (
                  <span
                    key={key}
                    className="text-sm font-medium px-3 py-1.5 rounded-xl bg-yellow-500/10 text-yellow-400"
                  >
                    {MAINTENANCE_LABELS[key]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rota */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <h3 className="font-semibold mb-4 text-white">Rota percorrida</h3>
            <RouteMap trip={trip} />
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
