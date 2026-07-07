"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { Header } from "@/components/admin/header";
import { KpiCard } from "@/components/admin/kpicard";
import { Table } from "@/components/admin/table";
import { TableRow } from "@/components/admin/tablerow";
import { TableCell } from "@/components/admin/tablecell";
import { StatusBadge } from "@/components/admin/statusbadge";

import { Button } from "@/components/ui/button";

import { getReportsData } from "@/services/reportService";
import { exportTripsToExcel, exportTripsToPDF } from "@/services/exportService";

import type { Trip } from "@/lib/db";

const EMPTY_REPORT = {
  stats: {
    totalTrips: 0,
    finishedTrips: 0,
    activeTrips: 0,
    totalKm: 0,
    averageKm: 0,
  },

  trips: [] as Trip[],

  drivers: [] as {
    id: string;
    name: string;
  }[],

  vehicles: [] as {
    id: string;
    model: string;
  }[],
};

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [driverFilter, setDriverFilter] = useState("Todos");
  const [vehicleFilter, setVehicleFilter] = useState("Todos");

  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;

  const reportData = useLiveQuery(() => getReportsData(), []) ?? EMPTY_REPORT;

  const loading = reportData === EMPTY_REPORT && reportData.trips.length === 0;

  const filteredTrips = useMemo(() => {
    return reportData.trips.filter((trip) => {
      const statusMatch =
        statusFilter === "Todos" || trip.status === statusFilter;

      const driverMatch =
        driverFilter === "Todos" || trip.driverId === driverFilter;

      const vehicleMatch =
        vehicleFilter === "Todos" || trip.vehicleId === vehicleFilter;

      return statusMatch && driverMatch && vehicleMatch;
    });
  }, [reportData.trips, statusFilter, driverFilter, vehicleFilter]);

  const filteredStats = useMemo(() => {
    const totalTrips = filteredTrips.length;

    const activeTrips = filteredTrips.filter(
      (trip) => trip.status === "Em andamento",
    ).length;

    const finishedTrips = filteredTrips.filter(
      (trip) => trip.status === "Finalizada",
    ).length;

    const totalKm = filteredTrips.reduce(
      (acc, trip) => acc + (trip.distance ?? 0),
      0,
    );

    const averageKm = totalTrips > 0 ? Math.round(totalKm / totalTrips) : 0;

    return {
      totalTrips,
      activeTrips,
      finishedTrips,
      totalKm,
      averageKm,
    };
  }, [filteredTrips]);

  const filteredKmPerVehicle = useMemo(() => {
    const grouped = new Map<
      string,
      {
        id: string;
        name: string;
        km: number;
      }
    >();

    filteredTrips.forEach((trip) => {
      const current = grouped.get(trip.vehicleId);

      if (current) {
        current.km += trip.distance ?? 0;
      } else {
        grouped.set(trip.vehicleId, {
          id: trip.vehicleId,
          name: trip.vehicleModel,
          km: trip.distance ?? 0,
        });
      }
    });

    return [...grouped.values()].sort((a, b) => b.km - a.km).slice(0, 5);
  }, [filteredTrips]);

  const filteredTripsPerDriver = useMemo(() => {
    const grouped = new Map<
      string,
      {
        id: string;
        name: string;
        trips: number;
      }
    >();

    filteredTrips.forEach((trip) => {
      const current = grouped.get(trip.driverId);

      if (current) {
        current.trips++;
      } else {
        grouped.set(trip.driverId, {
          id: trip.driverId,
          name: trip.driverName,
          trips: 1,
        });
      }
    });

    return [...grouped.values()].sort((a, b) => b.trips - a.trips).slice(0, 5);
  }, [filteredTrips]);

  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / PAGE_SIZE));

  const paginatedTrips = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredTrips.slice(start, start + PAGE_SIZE);
  }, [filteredTrips, page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Relatórios"
        description="Indicadores operacionais da frota"
      />

      {/* Exportação */}
      <div className="flex flex-wrap gap-4 mt-6 mb-8">
        <button
          onClick={() => exportTripsToPDF(filteredTrips)}
          className="bg-indigo-600 hover:bg-indigo-500 px-5 py-3 rounded-2xl font-medium transition"
        >
          Exportar PDF
        </button>

        <button
          onClick={() => exportTripsToExcel(filteredTrips)}
          className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-2xl font-medium transition"
        >
          Exportar Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8">
        <div className="flex flex-wrap gap-4">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="
              bg-zinc-950
              border
              border-zinc-700
              rounded-2xl
              px-4
              py-3
              min-w-[180px]
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
            "
          >
            <option value="Todos">Todos</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Finalizada">Finalizada</option>
          </select>

          {/* Motorista */}
          <select
            value={driverFilter}
            onChange={(e) => {
              setDriverFilter(e.target.value);
              setPage(1);
            }}
            className="
              bg-zinc-950
              border
              border-zinc-700
              rounded-2xl
              px-4
              py-3
              min-w-[220px]
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
            "
          >
            <option value="Todos">Todos os motoristas</option>

            {reportData.drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>

          {/* Veículo */}
          <select
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setPage(1);
            }}
            className="
              bg-zinc-950
              border
              border-zinc-700
              rounded-2xl
              px-4
              py-3
              min-w-[220px]
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
            "
          >
            <option value="Todos">Todos os veículos</option>

            {reportData.vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <KpiCard title="KM Total" value={`${filteredStats.totalKm} KM`} />

        <KpiCard title="Viagens" value={String(filteredStats.totalTrips)} />

        <KpiCard
          title="Em andamento"
          value={String(filteredStats.activeTrips)}
        />

        <KpiCard
          title="Média KM/Viagem"
          value={`${filteredStats.averageKm} KM`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        {/* KM por veículo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-lg font-semibold mb-6">
            Top 5 veículos por quilometragem
          </h3>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredKmPerVehicle}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

                <XAxis dataKey="name" stroke="#71717a" />

                <YAxis stroke="#71717a" />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "16px",
                  }}
                />

                <Bar dataKey="km" fill="#6366f1" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trips por motorista */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-lg font-semibold mb-6">
            Top 5 motoristas por viagens
          </h3>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredTripsPerDriver}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

                <XAxis dataKey="name" stroke="#71717a" />

                <YAxis stroke="#71717a" />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "16px",
                  }}
                />

                <Bar dataKey="trips" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <Table headers={["Motorista", "Veículo", "KM", "Status"]}>
        {paginatedTrips.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-zinc-500 py-10">
              Nenhuma viagem encontrada para os filtros selecionados.
            </TableCell>
          </TableRow>
        ) : (
          paginatedTrips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-medium">{trip.driverName}</TableCell>

              <TableCell>{trip.vehicleModel}</TableCell>

              <TableCell>
                {(trip.distance ?? 0).toLocaleString("pt-BR")} km
              </TableCell>

              <TableCell>
                <StatusBadge
                  status={
                    trip.status === "Em andamento" ? "active" : "available"
                  }
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </Table>

      {/* Paginação */}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="
              h-10
              px-4
              rounded-xl
              border-zinc-700
              bg-zinc-900
              text-zinc-300
              hover:bg-zinc-800
              hover:text-white
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >
            ← Anterior
          </Button>

          <div
            className="
              min-w-[130px]
              h-10
              px-4
              flex
              items-center
              justify-center
              rounded-xl
              bg-zinc-900
              border
              border-zinc-800
              text-sm
              font-medium
              text-zinc-300
            "
          >
            Página {page} de {totalPages}
          </div>

          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="
              h-10
              px-4
              rounded-xl
              border-zinc-700
              bg-zinc-900
              text-zinc-300
              hover:bg-indigo-600
              hover:border-indigo-600
              hover:text-white
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >
            Próxima →
          </Button>
        </div>
      )}
    </div>
  );
}
