"use client";

import { useEffect, useState } from "react";

import { Trip } from "@/lib/db";
import { getTrips } from "@/services/tripService";

import { Table } from "@/components/admin/table";
import { TableRow } from "@/components/admin/tablerow";
import { TableCell } from "@/components/admin/tablecell";
import { KpiCard } from "@/components/admin/kpicard";
import { Input } from "@/components/ui/input";
import { TripDrawer } from "@/components/admin/tripdrawer";

export default function TripsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "finished">("all");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
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
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadTrips() {
      const data = await getTrips();

      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      );

      setTrips(sorted);
    }

    loadTrips();
  }, []);

  const totalTrips = trips.length;

  const activeTrips = trips.filter(
    (trip) => trip.status === "Em andamento",
  ).length;

  const finishedTrips = trips.filter(
    (trip) => trip.status === "Finalizada",
  ).length;

  function getLiveDuration(startedAt: string, now: number) {
    const start = new Date(startedAt).getTime();
    const diff = now - start;
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);

    return `${hours}h ${minutes}min`;
  }
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Utilizações</h1>

        <p className="text-zinc-500 mt-2 mb-4">
          Histórico operacional da frota
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <KpiCard title="Total de utilizações" value={String(totalTrips)} />
        <KpiCard title="Finalizadas" value={String(finishedTrips)} />
        <KpiCard title="Em andamento" value={String(activeTrips)} />
        <KpiCard
          title="Última utilização"
          value={trips[0] ? `${trips[0].driverName}` : "-"}
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm transition ${
            filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-xl text-sm transition ${
            filter === "active"
              ? "bg-green-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Em andamento
        </button>
        <button
          onClick={() => setFilter("finished")}
          className={`px-4 py-2 rounded-xl text-sm transition ${
            filter === "finished"
              ? "bg-indigo-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Finalizadas
        </button>
        <Input
          placeholder="Buscar motorista, veículo ou placa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabela */}
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
          {filteredTrips.map((trip) => (
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
                  ? getLiveDuration(trip.startedAt, currentTime)
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
        <TripDrawer
          trip={selectedTrip}
          open={!!selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      </div>
    </div>
  );
}
