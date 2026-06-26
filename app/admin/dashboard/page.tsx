"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { StatusBadge } from "@/components/admin/statusbadge";
import { Table } from "@/components/admin/table";
import { TableCell } from "@/components/admin/tablecell";
import { TableRow } from "@/components/admin/tablerow";
import { KpiCard } from "@/components/admin/kpicard";
import { Header } from "@/components/admin/header";
import { db } from "@/lib/db";

const ITEMS_PER_PAGE = 10;

export default function AdminDashboardPage() {
  const [page, setPage] = useState(1);

  const vehicles = useLiveQuery(() => db.vehicles.toArray(), []);
  const drivers = useLiveQuery(() => db.drivers.toArray(), []);
  const trips = useLiveQuery(() => db.trips.reverse().sortBy("startedAt"), []);

  const availableVehicles =
    vehicles?.filter((v) => v.status === "Disponível").length ?? 0;
  const activeVehicles =
    vehicles?.filter((v) => v.status === "Em uso").length ?? 0;
  const totalDrivers = drivers?.filter((d) => d.status === "Ativo").length ?? 0;
  const totalTrips = trips?.length ?? 0;

  const totalPages = Math.ceil(totalTrips / ITEMS_PER_PAGE);
  const paginatedTrips = (trips ?? []).slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  return (
    <div>
      <Header
        title="Dashboard"
        description="Visão geral da operação da frota"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10 mt-8">
        <KpiCard title="Carros Disponíveis" value={String(availableVehicles)} />
        <KpiCard title="Em uso" value={String(activeVehicles)} />
        <KpiCard title="Motoristas" value={String(totalDrivers)} />
        <KpiCard title="Utilizações" value={String(totalTrips)} />
      </div>

      <Table headers={["Motorista", "Veículo", "KM", "Status"]}>
        {paginatedTrips.map((trip) => (
          <TableRow key={trip.id}>
            <TableCell className="font-medium">{trip.driverName}</TableCell>
            <TableCell>{trip.vehicleModel}</TableCell>
            <TableCell>{trip.distance || 0} km</TableCell>
            <TableCell>
              <StatusBadge
                status={trip.status === "Em andamento" ? "active" : "available"}
              />
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-zinc-500">
          Mostrando {totalTrips === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–
          {Math.min(page * ITEMS_PER_PAGE, totalTrips)} de {totalTrips}{" "}
          utilizações
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-10 px-4 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ←
          </button>

          <div className="min-w-[80px] h-10 px-4 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-zinc-300">
            {page} / {Math.max(totalPages, 1)}
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="h-10 px-4 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
