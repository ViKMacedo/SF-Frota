"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/lib/db";
import type { Trip } from "@/lib/db";

import { Table } from "@/components/admin/table";
import { TableRow } from "@/components/admin/tablerow";
import { TableCell } from "@/components/admin/tablecell";
import { KpiCard } from "@/components/admin/kpicard";
import { Input } from "@/components/ui/input";
import { TripDrawer } from "@/components/admin/tripdrawer";

const ITEMS_PER_PAGE = 10;

function getLiveDuration(startedAt: string) {
  const diff = Date.now() - new Date(startedAt).getTime();
  const hours = Math.floor(diff / 1000 / 60 / 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  return `${hours}h ${minutes}min`;
}

export default function TripsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "finished">("all");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [page, setPage] = useState(1);

  const trips =
    useLiveQuery(() =>
      db.trips
        .toArray()
        .then((data) =>
          data.sort(
            (a, b) =>
              new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
          ),
        ),
    ) ?? [];

  const filteredTrips = trips
    .filter((trip) => {
      if (filter === "active") return trip.status === "Em andamento";
      if (filter === "finished") return trip.status === "Finalizada";
      return true;
    })
    .filter((trip) => {
      const term = search.toLowerCase();
      return (
        trip.driverName.toLowerCase().includes(term) ||
        trip.vehicleModel.toLowerCase().includes(term) ||
        trip.vehiclePlate.toLowerCase().includes(term)
      );
    });

  const totalTrips = trips.length;
  const activeTrips = trips.filter((t) => t.status === "Em andamento").length;
  const finishedTrips = trips.filter((t) => t.status === "Finalizada").length;

  const totalPages = Math.ceil(filteredTrips.length / ITEMS_PER_PAGE);
  const paginatedTrips = filteredTrips.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  function handleFilterChange(f: "all" | "active" | "finished") {
    setFilter(f);
    setPage(1);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Utilizações</h1>
        <p className="text-zinc-500 mt-2 mb-4">
          Histórico operacional da frota
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <KpiCard title="Total de utilizações" value={String(totalTrips)} />
        <KpiCard title="Finalizadas" value={String(finishedTrips)} />
        <KpiCard title="Em andamento" value={String(activeTrips)} />
        <KpiCard
          title="Última utilização"
          value={trips[0]?.driverName ?? "-"}
        />
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {(["all", "active", "finished"] as const).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              filter === f
                ? f === "active"
                  ? "bg-green-600 text-white"
                  : "bg-indigo-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {
              { all: "Todas", active: "Em andamento", finished: "Finalizadas" }[
                f
              ]
            }
          </button>
        ))}
        <Input
          placeholder="Buscar motorista, veículo ou placa..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <Table
          headers={[
            "Motorista",
            "Veículo",
            "Início",
            "Fim",
            "KM Inicial",
            "KM Final",
            "KM Rodado",
            "Tempo",
            "Status",
          ]}
        >
          {paginatedTrips.map((trip) => (
            <TableRow
              key={trip.id}
              onClick={() => setSelectedTrip(trip)}
              className="cursor-pointer hover:bg-zinc-800/50 transition"
            >
              <TableCell className="font-medium">{trip.driverName}</TableCell>
              <TableCell>{trip.vehicleModel}</TableCell>
              <TableCell>
                {new Date(trip.startedAt).toLocaleString("pt-BR")}
              </TableCell>
              <TableCell>
                {trip.endedAt
                  ? new Date(trip.endedAt).toLocaleString("pt-BR")
                  : "-"}
              </TableCell>
              <TableCell>{trip.startKm}</TableCell>
              <TableCell>{trip.endKm ?? "-"}</TableCell>
              <TableCell>{trip.distance ?? "-"} km</TableCell>
              <TableCell>
                {trip.status === "Em andamento"
                  ? getLiveDuration(trip.startedAt)
                  : trip.duration}
              </TableCell>
              <TableCell>
                {trip.status === "Em andamento" ? (
                  <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm">
                    Em uso
                  </span>
                ) : (
                  <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-sm">
                    Finalizado
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {filteredTrips.length === 0 && (
            <TableRow>
              <td colSpan={9} className="text-center py-8 text-zinc-500">
                Nenhuma utilização encontrada.
              </td>
            </TableRow>
          )}
        </Table>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-zinc-800">
          <p className="text-sm text-zinc-500">
            Mostrando{" "}
            {filteredTrips.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(page * ITEMS_PER_PAGE, filteredTrips.length)} de{" "}
            {filteredTrips.length} utilizações
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ←
            </button>
            <span className="px-4 py-2 text-sm font-medium text-zinc-400">
              Página {page} de {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              →
            </button>
          </div>
        </div>

        <TripDrawer
          trip={selectedTrip}
          open={!!selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      </div>
    </div>
  );
}
