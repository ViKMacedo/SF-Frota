"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [driverFilter, setDriverFilter] = useState("Todos");
  const [vehicleFilter, setVehicleFilter] = useState("Todos");
  const [reportData, setReportData] = useState({
    stats: {
      totalTrips: 0,
      finishedTrips: 0,
      activeTrips: 0,
      totalKm: 0,
      averageKm: 0,
    },
    kmPerVehicle: [] as {
      name: string;
      km: number;
    }[],
    tripsPerDriver: [] as {
      name: string;
      trips: number;
    }[],
    recentTrips: [] as Trip[],
  });
  useEffect(() => {
    async function fetchReports() {
      const data = await getReportsData();
      setReportData(data);
      setLoading(false);
    }
    fetchReports();
  }, []);

  const filteredTrips = useMemo(() => {
    return reportData.recentTrips.filter((trip) => {
      const statusMatch =
        statusFilter === "Todos" || trip.status === statusFilter;
      const driverMatch =
        driverFilter === "Todos" || trip.driverName === driverFilter;
      const vehicleMatch =
        vehicleFilter === "Todos" || trip.vehicleModel === vehicleFilter;
      return statusMatch && driverMatch && vehicleMatch;
    });
  }, [reportData.recentTrips, statusFilter, driverFilter, vehicleFilter]);

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
      {/* Header */}
      <Header
        title="Relatórios"
        description="Indicadores operacionais da frota"
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mt-6 mb-8">
        <button
          onClick={() => exportTripsToPDF(filteredTrips)}
          className="
            bg-indigo-600
            hover:bg-indigo-500
            px-5
            py-3
            rounded-2xl
            font-medium
            transition
          "
        >
          Exportar PDF
        </button>

        <button
          onClick={() => exportTripsToExcel(filteredTrips)}
          className="
            bg-zinc-800
            hover:bg-zinc-700
            px-5
            py-3
            rounded-2xl
            font-medium
            transition
          "
        >
          Exportar Excel
        </button>
      </div>

      {/* Filters */}
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

          {/* Driver */}
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
            {[
              ...new Set(reportData.recentTrips.map((trip) => trip.driverName)),
            ].map((driver) => (
              <option key={driver}>{driver}</option>
            ))}
          </select>

          {/* Vehicle */}
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
              ...new Set(
                reportData.recentTrips.map((trip) => trip.vehicleModel),
              ),
            ].map((vehicle) => (
              <option key={vehicle}>{vehicle}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <KpiCard title="KM total" value={`${reportData.stats.totalKm} KM`} />
        <KpiCard
          title="Utilizações"
          value={String(reportData.stats.totalTrips)}
        />
        <KpiCard
          title="Em andamento"
          value={String(reportData.stats.activeTrips)}
        />
        <KpiCard
          title="Média KM/trip"
          value={`${reportData.stats.averageKm} KM`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-1 gap-6 mb-10">
        {/* KM por veículo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-xl font-semibold mb-6">KM por veículo</h3>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={reportData.kmPerVehicle}>
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
              <BarChart data={reportData.tripsPerDriver}>
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

      {/* Table */}
      <Table headers={["Motorista", "Veículo", "KM", "Status"]}>
        {filteredTrips.map((trip) => (
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
    </div>
  );
}
