"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";

import { AlertTriangle, Clock3, Fuel, ArrowRight } from "lucide-react";

import { Header } from "@/components/admin/header";
import { KpiCard } from "@/components/admin/kpicard";
import { StatusBadge } from "@/components/admin/statusbadge";

import { Table } from "@/components/admin/table";
import { TableCell } from "@/components/admin/tablecell";
import { TableRow } from "@/components/admin/tablerow";

import { db } from "@/lib/db";

import { getVehicleMaintenanceStatus } from "@/services/maintenanceService";

import { estimateFuelLevel } from "@/services/refuelService";

const TRIPS_PER_PAGE = 10;
const ATTENTION_PER_PAGE = 6;

export default function AdminDashboardPage() {
  const router = useRouter();

  const [tripPage, setTripPage] = useState(1);
  const [attentionPage, setAttentionPage] = useState(1);

  const vehicles = useLiveQuery(() => db.vehicles.toArray(), []) ?? [];

  const drivers = useLiveQuery(() => db.drivers.toArray(), []) ?? [];

  const trips =
    useLiveQuery(() => db.trips.reverse().sortBy("startedAt"), []) ?? [];

  /*
  |--------------------------------------------------------------------------
  | KPIs
  |--------------------------------------------------------------------------
  */

  const availableVehicles = vehicles.filter(
    (v) => v.status === "Disponível",
  ).length;

  const activeVehicles = vehicles.filter((v) => v.status === "Em uso").length;

  const totalDrivers = drivers.filter((d) => d.status === "Ativo").length;

  const totalTrips = trips.length;

  const totalTripPages = Math.max(1, Math.ceil(totalTrips / TRIPS_PER_PAGE));

  const paginatedTrips = trips.slice(
    (tripPage - 1) * TRIPS_PER_PAGE,
    tripPage * TRIPS_PER_PAGE,
  );

  const vehiclesAttention = vehicles
    .map((vehicle) => {
      const maintenance = getVehicleMaintenanceStatus(vehicle);

      const overdue = Object.values(maintenance ?? {}).find(
        (item) => item.urgency === "vencido",
      );

      const upcoming = Object.values(maintenance ?? {}).find(
        (item) => item.urgency === "proximo",
      );

      const fuel = estimateFuelLevel(vehicle, vehicle.km);

      return {
        vehicle,
        overdue,
        upcoming,
        fuel,
      };
    })
    .filter(
      ({ overdue, upcoming, fuel }) =>
        overdue || upcoming || (fuel !== undefined && fuel < 20),
    )
    .sort((a, b) => {
      /*
      prioridade:

      manutenção vencida

      manutenção próxima

      combustível baixo
      */

      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;

      if (a.upcoming && !b.upcoming) return -1;
      if (!a.upcoming && b.upcoming) return 1;

      return (a.fuel ?? 100) - (b.fuel ?? 100);
    });

  /*
  |--------------------------------------------------------------------------
  | Paginação do painel lateral
  |--------------------------------------------------------------------------
  */

  const totalAttentionPages = Math.max(
    1,
    Math.ceil(vehiclesAttention.length / ATTENTION_PER_PAGE),
  );

  const paginatedAttention = vehiclesAttention.slice(
    (attentionPage - 1) * ATTENTION_PER_PAGE,
    attentionPage * ATTENTION_PER_PAGE,
  );

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  function getBorderClass(item: {
    overdue?: unknown;
    upcoming?: unknown;
    fuel?: number;
  }) {
    if (item.overdue) return "border-red-500/40";

    if (item.upcoming) return "border-yellow-500/40";

    if (item.fuel !== undefined && item.fuel < 20) return "border-blue-500/40";

    return "border-zinc-800";
  }

  function getStatusIcon(item: {
    overdue?: unknown;
    upcoming?: unknown;
    fuel?: number;
  }) {
    if (item.overdue) return <AlertTriangle className="w-4 h-4 text-red-400" />;

    if (item.upcoming) return <Clock3 className="w-4 h-4 text-yellow-400" />;

    return <Fuel className="w-4 h-4 text-blue-400" />;
  }

  function getStatusText(item: {
    overdue?: { label: string };
    upcoming?: { label: string };
    fuel?: number;
  }) {
    if (item.overdue) return item.overdue.label;

    if (item.upcoming) return item.upcoming.label;

    return `Combustível ${Math.round(item.fuel ?? 0)}%`;
  }
  return (
    <div>
      <Header
        title="Dashboard"
        description="Visão geral da operação da frota"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8 mb-10">
        <KpiCard title="Carros Disponíveis" value={String(availableVehicles)} />

        <KpiCard title="Em uso" value={String(activeVehicles)} />

        <KpiCard title="Motoristas" value={String(totalDrivers)} />

        <KpiCard title="Utilizações" value={String(totalTrips)} />
      </div>

      {/* Conteúdo */}
      <div className="grid xl:grid-cols-3 gap-8">
        {/* ===================== */}
        {/* Utilizações */}
        {/* ===================== */}

        <div className="xl:col-span-2">
          <Table headers={["Motorista", "Veículo", "KM", "Status"]}>
            {paginatedTrips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-medium">{trip.driverName}</TableCell>

                <TableCell>{trip.vehicleModel}</TableCell>

                <TableCell>{trip.distance ?? 0} km</TableCell>

                <TableCell>
                  <StatusBadge
                    status={
                      trip.status === "Em andamento" ? "active" : "available"
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </Table>

          {/* Paginação */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-zinc-500">
              Mostrando{" "}
              {totalTrips === 0 ? 0 : (tripPage - 1) * TRIPS_PER_PAGE + 1}–
              {Math.min(tripPage * TRIPS_PER_PAGE, totalTrips)} de {totalTrips}
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={tripPage === 1}
                onClick={() => setTripPage((p) => p - 1)}
                className="
                h-10
                px-4
                rounded-xl
                bg-zinc-900
                border
                border-zinc-700
                hover:bg-zinc-800
                disabled:opacity-40
              "
              >
                ←
              </button>

              <div
                className="
                h-10
                min-w-[80px]
                rounded-xl
                bg-zinc-900
                border
                border-zinc-800
                flex
                items-center
                justify-center
                text-sm
              "
              >
                {tripPage} / {totalTripPages}
              </div>

              <button
                disabled={tripPage >= totalTripPages}
                onClick={() => setTripPage((p) => p + 1)}
                className="
                h-10
                px-4
                rounded-xl
                bg-indigo-600
                hover:bg-indigo-500
                disabled:opacity-40
              "
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* ===================== */}
        {/* Atenção da Frota */}
        {/* ===================== */}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Atenção da frota</h2>

            <p className="text-sm text-zinc-500 mt-1">
              Veículos que exigem ação imediata
            </p>
          </div>

          <div className="space-y-4">
            {paginatedAttention.length === 0 && (
              <div
                className="
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-800/30
                py-10
                text-center
              "
              >
                <p className="text-zinc-500 text-sm">
                  Nenhum alerta encontrado.
                </p>
              </div>
            )}

            {paginatedAttention.map((item) => (
              <button
                key={item.vehicle.id}
                onClick={() =>
                  router.push(`/admin/vehicles/${item.vehicle.id}`)
                }
                className={`
                group
                w-full
                rounded-2xl
                border
                bg-zinc-800/40
                p-4
                text-left
                transition-all
                duration-200
                hover:bg-zinc-800/70
                hover:border-indigo-500/40
                hover:-translate-y-0.5
                ${getBorderClass(item)}
              `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {item.vehicle.model}
                    </h3>

                    <p className="text-sm text-zinc-500">
                      {item.vehicle.plate}
                    </p>
                  </div>

                  <ArrowRight
                    className="
                    w-4
                    h-4
                    text-zinc-500
                    group-hover:text-white
                    transition
                  "
                  />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {getStatusIcon(item)}

                  <span className="text-sm text-zinc-300">
                    {getStatusText(item)}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {/* Paginação do painel */}

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">
              {vehiclesAttention.length} alerta
              {vehiclesAttention.length !== 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={attentionPage === 1}
                onClick={() => setAttentionPage((p) => p - 1)}
                className="
                h-10
                px-4
                rounded-xl
                border
                border-zinc-700
                bg-zinc-900
                hover:bg-zinc-800
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition
              "
              >
                ←
              </button>

              <div
                className="
                min-w-[90px]
                h-10
                rounded-xl
                border
                border-zinc-800
                bg-zinc-900
                flex
                items-center
                justify-center
                text-sm
                text-zinc-300
              "
              >
                {attentionPage} / {totalAttentionPages}
              </div>

              <button
                disabled={attentionPage >= totalAttentionPages}
                onClick={() => setAttentionPage((p) => p + 1)}
                className="
                h-10
                px-4
                rounded-xl
                border
                border-indigo-600
                bg-indigo-600
                hover:bg-indigo-500
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition
              "
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
