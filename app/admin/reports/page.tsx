"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { Header } from "@/components/admin/header";
import { KpiCard } from "@/components/admin/kpicard";
import { Table } from "@/components/admin/table";
import { TableRow } from "@/components/admin/tablerow";
import { TableCell } from "@/components/admin/tablecell";
import { StatusBadge } from "@/components/admin/statusbadge";
import { getReportsData } from "@/services/reportService";
import { exportTripsToPDF, exportTripsToExcel } from "@/services/exportService";

import type { Trip } from "@/lib/db";
import { Button } from "@/components/ui/button";

const EMPTY_REPORT = {
  stats: {
    totalTrips: 0,
    finishedTrips: 0,
    activeTrips: 0,
    totalKm: 0,
    averageKm: 0,
  },
  kmPerVehicle: [] as { name: string; km: number }[],
  tripsPerDriver: [] as { name: string; trips: number }[],
  trips: [] as Trip[],
};

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [driverFilter, setDriverFilter] = useState("Todos");
  const [vehicleFilter, setVehicleFilter] = useState("Todos");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // useLiveQuery observa o Dexie e recalcula sempre que trips/vehicles/drivers mudam
  const reportData = useLiveQuery(() => getReportsData(), []) ?? EMPTY_REPORT;
  const loading = reportData === EMPTY_REPORT && reportData.trips.length === 0;

  const filteredTrips = useMemo(() => {
    return reportData.trips.filter((trip) => {
      const statusMatch =
        statusFilter === "Todos" || trip.status === statusFilter;
      const driverMatch =
        driverFilter === "Todos" || trip.driverName === driverFilter;
      const vehicleMatch =
        vehicleFilter === "Todos" || trip.vehicleModel === vehicleFilter;
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
      (acc, trip) => acc + (trip.distance || 0),
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
    const grouped = new Map<string, number>();

    filteredTrips.forEach((trip) => {
      const current = grouped.get(trip.vehicleModel) || 0;
      grouped.set(trip.vehicleModel, current + (trip.distance || 0));
    });
    return Array.from(grouped.entries()).map(([name, km]) => ({
      name,
      km,
    }));
  }, [filteredTrips]);

  const filteredTripsPerDriver = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredTrips.forEach((trip) => {
      const current = grouped.get(trip.driverName) || 0;
      grouped.set(trip.driverName, current + 1);
    });
    return Array.from(grouped.entries()).map(([name, trips]) => ({
      name,
      trips,
    }));
  }, [filteredTrips]);
  const totalPages = Math.ceil(filteredTrips.length / PAGE_SIZE);
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8">
        <div className="flex flex-wrap gap-4">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option>Todos</option>
            <option>Em andamento</option>
            <option>Finalizada</option>
          </select>

          {/* Motorista */}
          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
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
            <option>Todos</option>
            {[...new Set(reportData.trips.map((trip) => trip.driverName))].map(
              (driver) => (
                <option key={driver}>{driver}</option>
              ),
            )}
          </select>

          {/* Veículo */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
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
            <option>Todos</option>
            {[
              ...new Set(reportData.trips.map((trip) => trip.vehicleModel)),
            ].map((vehicle) => (
              <option key={vehicle}>{vehicle}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <KpiCard title="KM total" value={`${filteredStats.totalKm} KM`} />
        <KpiCard title="Utilizações" value={String(filteredStats.totalTrips)} />
        <KpiCard
          title="Em andamento"
          value={String(filteredStats.activeTrips)}
        />
        <KpiCard
          title="Média KM/trip"
          value={`${filteredStats.averageKm} KM`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-10">
        {/* KM por veículo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-xl font-semibold mb-6">KM por veículo</h3>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height={320}>
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
                <Bar dataKey="km" fill="#6366f1" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trips por motorista */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-xl font-semibold mb-6">Trips por motorista</h3>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height={320}>
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
                <Bar dataKey="trips" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela */}
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
      transition-all
    "
        >
          ← Anterior
        </Button>

        <div
          className="
      min-w-[120px]
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
      transition-all
    "
        >
          Próxima →
        </Button>
      </div>
    </div>
  );
}
